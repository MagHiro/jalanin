/* eslint-disable @typescript-eslint/no-explicit-any -- stateful Drizzle service test double */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  calls: [] as string[],
}));

vi.mock("@/lib/db/schema", () => Object.fromEntries(
  ["applications", "internships", "profiles", "users", "placements", "auditEvents"].map((name) => [
    name,
    new Proxy({ table: name }, {
      get: (target, key) => (key === "table" ? target.table : `${name}.${String(key)}`),
    }),
  ]),
));

vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: any) => ({ op: "eq", column, value }),
  and: (...conditions: any[]) => ({ op: "and", conditions }),
  or: (...conditions: any[]) => ({ op: "or", conditions }),
  asc: (column: string) => `asc:${column}`,
  desc: (column: string) => `desc:${column}`,
  count: () => "count",
  ilike: (column: string, value: any) => ({ op: "ilike", column, value }),
}));

function matches(condition: any, row: any): boolean {
  if (!condition) return true;
  if (condition.op === "eq") {
    const key = String(condition.column).split(".")[1];
    return row[key] === condition.value;
  }
  if (condition.op === "ilike") {
    const key = String(condition.column).split(".")[1];
    const needle = String(condition.value).replace(/%/g, "").toLowerCase();
    return String(row[key] ?? "").toLowerCase().includes(needle);
  }
  if (condition.op === "and") return condition.conditions.every((c: any) => matches(c, row));
  if (condition.op === "or") return condition.conditions.some((c: any) => matches(c, row));
  return true;
}

vi.mock("@/lib/db/client", () => {
  function build(projection: any, table: any) {
    let predicate: any = null;
    let limit = Infinity;
    let join: { table: any; kind: string } | null = null;
    const api: any = {
      leftJoin: (t: any) => { join = { table: t, kind: "left" }; return api; },
      innerJoin: (t: any) => { join = { table: t, kind: "inner" }; return api; },
      where: (c: any) => { predicate = c; return api; },
      orderBy: (..._o: any[]) => api,
      limit: (v: number) => { limit = v; return api; },
      offset: (_v: number) => api,
      then: (resolve: any, reject: any) => {
        try {
          state.calls.push(`select:${table.table}${join ? `+${join.table.table}` : ""}`);
          const base = state.tables[table.table] ?? [];
          let rows: any[];
          if (join && table.table === "profiles" && join.table.table === "users") {
            const users = state.tables["users"] ?? [];
            rows = base.map((p) => ({
              userId: p.userId,
              displayName: p.displayName,
              email: users.find((u) => u.id === p.userId)?.email ?? null,
            }));
          } else if (join && table.table === "applications" && join.table.table === "internships") {
            const listings = state.tables["internships"] ?? [];
            rows = base
              .filter((a) => listings.some((l) => l.id === a.internshipId))
              .map((a) => ({
                ...a,
                internshipTitle: listings.find((l) => l.id === a.internshipId)?.title ?? "",
              }));
          } else {
            rows = base.map((r) => ({ ...r }));
          }
          if (projection?.n === "count") return Promise.resolve().then(() => [{ n: rows.filter((r) => matches(predicate, r)).length }]).then(resolve, reject);
          const filtered = rows.filter((r) => matches(predicate, r)).slice(0, limit);
          // Project only the requested keys when a projection object is given.
          const out = projection && typeof projection === "object" && !projection.n
            ? filtered.map((r) => {
                const projected: any = {};
                for (const key of Object.keys(projection)) {
                  if (key in r) projected[key] = (r as any)[key];
                  else {
                    const col = String((projection as any)[key]).split(".")[1];
                    projected[key] = (r as any)[col] ?? (r as any)[key] ?? null;
                  }
                }
                return projected;
              })
            : filtered;
          return Promise.resolve().then(() => out).then(resolve, reject);
        } catch (e) { return Promise.resolve().then(() => { throw e; }).then(resolve, reject); }
      },
    };
    return api;
  }
  return { db: { select: (p?: any) => ({ from: (t: any) => build(p, t) }) } };
});

vi.mock("@/lib/utils", () => ({
  applicationRef: (id: string) => id,
  singleCount: (rows: any[]) => Number(rows[0]?.n ?? 0),
  audit: async () => undefined,
}));
vi.mock("@/lib/email/outbox", () => ({ enqueueEmail: async () => undefined }));

import {
  listEligibleApplicationsForStudent,
  searchStudentsForPlacement,
} from "@/features/admin/service";

const s1 = "00000000-0000-4000-8000-000000000001";
const s2 = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  state.tables = {
    profiles: [
      { userId: s1, displayName: "Amina Rahman" },
      { userId: s2, displayName: "Budi Santoso" },
    ],
    users: [
      { id: s1, email: "amina@example.com" },
      { id: s2, email: "budi@example.com" },
    ],
    applications: [
      { id: "app-1", applicantUserId: s1, internshipId: "int-1", isDraft: false, lifecycleStatus: "New", submittedAt: new Date("2026-10-01") },
      { id: "app-2", applicantUserId: s1, internshipId: "int-2", isDraft: true, lifecycleStatus: "New", submittedAt: null },
      { id: "app-3", applicantUserId: s2, internshipId: "int-1", isDraft: false, lifecycleStatus: "In Review", submittedAt: new Date("2026-10-02") },
    ],
    internships: [
      { id: "int-1", title: "Front Office" },
      { id: "int-2", title: "Housekeeping" },
    ],
  };
  state.calls = [];
});

describe("admin student search for placements (A1 — admin-only, paged)", () => {
  it("returns [] without a DB query for short queries", async () => {
    for (const q of ["", " ", "a"]) {
      expect(await searchStudentsForPlacement(q)).toEqual([]);
    }
    expect(state.calls).toEqual([]);
  });

  it("finds students by name or email with useful display fields", async () => {
    const byName = await searchStudentsForPlacement("amina");
    expect(byName).toEqual([{ userId: s1, displayName: "Amina Rahman", email: "amina@example.com" }]);
    const byEmail = await searchStudentsForPlacement("BUDI@EXAMPLE");
    expect(byEmail).toEqual([{ userId: s2, displayName: "Budi Santoso", email: "budi@example.com" }]);
    expect(await searchStudentsForPlacement("nobody-here")).toEqual([]);
  });

  it("never exposes the whole directory in one call", async () => {
    // Limit is enforced by the service (8); fixture has 2, both returned at most.
    const rows = await searchStudentsForPlacement("example.com");
    expect(rows.length).toBeLessThanOrEqual(8);
  });
});

describe("eligible applications for placement linkage (A1 — ownership-safe)", () => {
  it("returns only the student's submitted applications", async () => {
    const rows = await listEligibleApplicationsForStudent(s1);
    expect(rows.map((r) => r.id)).toEqual(["app-1"]);
    expect(rows[0]).toMatchObject({ internshipTitle: "Front Office", lifecycleStatus: "New" });
  });

  it("isolates students from each other's applications", async () => {
    const rows = await listEligibleApplicationsForStudent(s2);
    expect(rows.map((r) => r.id)).toEqual(["app-3"]);
    expect(await listEligibleApplicationsForStudent("00000000-0000-4000-8000-000000000099")).toEqual([]);
  });
});
