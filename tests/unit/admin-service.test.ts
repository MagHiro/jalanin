/* eslint-disable @typescript-eslint/no-explicit-any -- stateful Drizzle service test double */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  locks: [] as string[],
  orders: [] as string[],
  failAudit: false,
  tail: Promise.resolve(),
}));
vi.mock("@/lib/db/schema", () => Object.fromEntries([
  "adminNotifications", "adminUsers", "applicationDocuments", "applicationRevisions",
  "applicationStatusEvents", "applications", "auditEvents", "categories", "internships",
  "placements", "profiles", "quotations",
].map((name) => [name, new Proxy({ table: name }, {
  get: (target, key) => key === "table" ? target.table : `${name}.${String(key)}`,
})])));
vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: any) => (row: any) => row[column.split(".")[1]] === value,
  and: (...conditions: any[]) => (row: any) => conditions.every((condition) => condition(row)),
  or: (...conditions: any[]) => (row: any) => conditions.some((condition) => condition(row)),
  asc: (column: string) => `asc:${column}`,
  desc: (column: string) => `desc:${column}`,
  count: () => "count",
  ilike: vi.fn(),
}));
vi.mock("@/lib/db/client", () => {
  function client(transactional = false): any {
    return {
      select: (projection?: any) => ({ from: (table: any) => {
        let predicate = () => true;
        let limit = Infinity;
        let offset = 0;
        const execute = () => {
          const rows = (state.tables[table.table] ?? []).filter(predicate);
          if (projection?.n === "count") return [{ n: rows.length }];
          return rows.slice(offset, offset + limit).map((row) => ({ ...row }));
        };
        const query: any = {
          where: (condition: any) => { predicate = condition ?? (() => true); return query; },
          limit: (value: number) => { limit = value; return query; },
          offset: (value: number) => { offset = value; return query; },
          orderBy: (...orders: string[]) => { state.orders = orders; return query; },
          for: (mode: string) => {
            if (!transactional) throw new Error("Lock outside transaction");
            state.locks.push(`${table.table}:${mode}`);
            return query;
          },
          then: (resolve: any, reject: any) => Promise.resolve().then(execute).then(resolve, reject),
        };
        return query;
      } }),
      update: (table: any) => ({ set: (patch: any) => ({ where: async (predicate: any) => {
        if (!transactional) throw new Error("Mutation outside transaction");
        for (const row of state.tables[table.table] ?? []) if (predicate(row)) Object.assign(row, patch);
      } }) }),
      insert: (table: any) => ({ values: (values: any) => {
        const execute = () => {
          if (!transactional) throw new Error("Mutation outside transaction");
          if (table.table === "auditEvents" && state.failAudit) throw new Error("Audit unavailable");
          const rows = state.tables[table.table] ??= [];
          const row = { id: `created-${rows.length}`, ...values };
          rows.push(row);
          return [row];
        };
        return {
          returning: async () => execute(),
          then: (resolve: any, reject: any) => Promise.resolve().then(execute).then(resolve, reject),
        };
      } }),
    };
  }
  return { db: {
    ...client(),
    // Serialize competing transactions and restore all writes on failure.
    // Tests separately assert the service requests the required row locks.
    transaction: (callback: any) => {
      const result = state.tail.then(async () => {
        const before = structuredClone(state.tables);
        try { return await callback(client(true)); }
        catch (error) { state.tables = before; throw error; }
      });
      state.tail = result.then(() => undefined, () => undefined);
      return result;
    },
  } };
});
vi.mock("@/lib/utils", () => ({
  applicationRef: (id: string) => id,
  singleCount: (rows: any[]) => Number(rows[0]?.n ?? 0),
  audit: async (event: any, tx: any) => {
    const { auditEvents } = await import("@/lib/db/schema");
    await tx.insert(auditEvents).values(event);
  },
}));
vi.mock("@/lib/email/outbox", () => ({
  enqueueEmail: async (event: any, tx: any) => {
    await tx.insert({ table: "outbox" }).values(event);
  },
}));

import {
  acknowledgeRevision, listAdminPlacements, reopenRejected, saveInternship,
  savePlacement, transitionPlacement,
} from "@/features/admin/service";
import { DomainError } from "@/lib/errors/domain-error";

const student = "00000000-0000-4000-8000-000000000001";
const otherStudent = "00000000-0000-4000-8000-000000000002";
const appId = "00000000-0000-4000-8000-000000000003";
const actor = { id: "admin" };
const placement = { studentUserId: student, applicationId: appId, organization: "Host", role: "Intern", countryCode: "SG" };
const internship = {
  title: "Internship", slug: "internship", city: "Singapore", countryCode: "SG",
  startDate: "2027-01-01", endDate: "2027-02-01", description: "Description",
  responsibilities: "Responsibilities", requirements: "Requirements", publicationStatus: "Published",
};

beforeEach(() => {
  state.tables = {
    applications: [{ id: appId, applicantUserId: student, isDraft: false, revision: 3,
      needsReReview: true, reviewedRevision: 2, lifecycleStatus: "Rejected", internshipId: "listing" }],
    profiles: [{ userId: student }],
    placements: [{ id: "placement", ...placement, placementStatus: "Preparing" }],
    internships: [{ id: "listing", publishedAt: new Date("2025-01-01"), title: "Listing" }],
    adminNotifications: [{ applicationId: appId, isRead: false }],
  };
  state.locks = [];
  state.orders = [];
  state.failAudit = false;
  state.tail = Promise.resolve();
});

describe("admin service correctness", () => {
  it.each([2, undefined])("rejects stale or omitted acknowledgement revision (%s) without writes", async (expectedRevision) => {
    const before = structuredClone(state.tables);
    await expect(acknowledgeRevision({ adminId: actor.id, applicationId: appId, expectedRevision: expectedRevision as number })).rejects.toBeInstanceOf(DomainError);
    expect(state.tables).toEqual(before);
    expect(state.locks).toEqual(["applications:update"]);
  });

  it("acknowledges exactly the locked revision and marks notifications read", async () => {
    await acknowledgeRevision({ adminId: actor.id, applicationId: appId, expectedRevision: 3 });
    expect(state.tables.applications[0]).toMatchObject({ reviewedRevision: 3, needsReReview: false });
    expect(state.tables.adminNotifications[0].isRead).toBe(true);
    expect(state.tables.auditEvents[0].changes).toEqual({ revision: 3 });
  });

  it("locks competing reopens and emits only one event, audit, and email", async () => {
    const input = { adminId: actor.id, applicationId: appId, reason: "Reconsidered" };
    const results = await Promise.allSettled([reopenRejected(input), reopenRejected(input)]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
    expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(DomainError);
    expect(state.locks).toEqual(["applications:update", "applications:update"]);
    for (const table of ["applicationStatusEvents", "auditEvents", "outbox"]) expect(state.tables[table]).toHaveLength(1);
  });

  it("locks competing placement transitions so only one transition succeeds", async () => {
    const input = { adminId: actor.id, placementId: "placement", to: "Confirmed" };
    const results = await Promise.allSettled([transitionPlacement(input), transitionPlacement(input)]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected"]);
    expect((results[1] as PromiseRejectedResult).reason).toBeInstanceOf(DomainError);
    expect(state.tables.auditEvents).toHaveLength(1);
    expect(state.locks).toEqual(["placements:update", "placements:update"]);
  });

  it.each(["create", "edit"])("validates linked application ownership and draft status on placement %s", async (mode) => {
    for (const invalid of [undefined, { applicantUserId: otherStudent, isDraft: false }, { applicantUserId: student, isDraft: true }]) {
      state.tables.applications = invalid ? [{ id: appId, ...invalid }] : [];
      await expect(savePlacement(actor, placement, mode === "edit" ? "placement" : undefined)).rejects.toBeInstanceOf(DomainError);
      expect(state.tables.placements).toHaveLength(1);
      expect(state.tables.auditEvents).toBeUndefined();
    }
  });

  it("rejects student reassignment even if the application matches the supplied student", async () => {
    state.tables.applications[0].applicantUserId = otherStudent;
    await expect(savePlacement(actor, { ...placement, studentUserId: otherStudent }, "placement")).rejects.toBeInstanceOf(DomainError);
    expect(state.tables.placements[0].studentUserId).toBe(student);
    expect(state.locks).toEqual(["placements:update"]);
  });

  it("requires an existing student profile when creating an unlinked placement", async () => {
    state.tables.profiles = [];
    await expect(savePlacement(actor, { ...placement, applicationId: null })).rejects.toBeInstanceOf(DomainError);
    expect(state.tables.placements).toHaveLength(1);
  });

  it("saves a valid linked placement and permits explicitly unlinking it", async () => {
    await savePlacement(actor, placement);
    await savePlacement(actor, { ...placement, applicationId: null }, "placement");
    expect(state.tables.placements).toHaveLength(2);
    expect(state.tables.placements[0].applicationId).toBeNull();
    expect(state.tables.auditEvents).toHaveLength(2);
    expect(state.locks).toContain("placements:update");
    expect(state.locks).toContain("applications:share");
  });

  it.each([
    () => savePlacement(actor, placement, "missing"),
    () => saveInternship(actor, internship, "missing"),
    () => transitionPlacement({ adminId: actor.id, placementId: "missing", to: "Confirmed" }),
    () => acknowledgeRevision({ adminId: actor.id, applicationId: "missing", expectedRevision: 3 }),
    () => reopenRejected({ adminId: actor.id, applicationId: "missing", reason: "Review" }),
  ])("rejects a missing mutation target with a safe business error", async (mutate) => {
    await expect(mutate()).rejects.toBeInstanceOf(DomainError);
    expect(state.tables.auditEvents).toBeUndefined();
  });

  it.each([
    () => saveInternship(actor, internship),
    () => saveInternship(actor, internship, "listing"),
    () => savePlacement(actor, placement),
    () => savePlacement(actor, { ...placement, organization: "Changed" }, "placement"),
    () => transitionPlacement({ adminId: actor.id, placementId: "placement", to: "Confirmed" }),
  ])("rolls back the mutation when its audit fails", async (mutate) => {
    state.failAudit = true;
    const before = structuredClone(state.tables);
    await expect(mutate()).rejects.toThrow("Audit unavailable");
    expect(state.tables).toEqual(before);
  });

  it("preserves original publication time while editing and audits creates", async () => {
    const publishedAt = state.tables.internships[0].publishedAt;
    await saveInternship(actor, internship, "listing");
    await saveInternship(actor, internship);
    expect(state.tables.internships[0].publishedAt).toEqual(publishedAt);
    expect(state.tables.auditEvents.map((row) => row.action)).toEqual(["updated", "created"]);
    expect(state.locks).toEqual(["internships:update"]);
  });

  it("uses the placement id as the stable pagination tiebreaker", async () => {
    await listAdminPlacements({ page: 1, pageSize: 20 });
    expect(state.orders).toEqual(["desc:placements.updatedAt", "asc:placements.id"]);
  });
});
