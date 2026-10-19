/* eslint-disable @typescript-eslint/no-explicit-any -- stateful Drizzle service test double */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: [] as any[], locks: [] as string[], submitBeforeLock: false,
  insertWinner: undefined as any, update: vi.fn(),
}));
vi.mock("@/lib/db/schema", () => Object.fromEntries([
  "adminNotifications", "applicationDocuments", "applicationRevisions",
  "applicationStatusEvents", "applications", "consentRecords", "internships",
  "policyVersions", "profiles",
].map((name) => [name, new Proxy({ table: name }, {
  get: (target, key) => key === "table" ? target.table : `${name}.${String(key)}`,
})])));
vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: any) => (row: any) => row[column.split(".")[1]] === value,
  and: (...conditions: any[]) => (row: any) => conditions.every((condition) => condition(row)),
  desc: vi.fn(),
}));
vi.mock("@/lib/db/client", () => {
  const client = (transactional = false): any => ({
    select: () => ({ from: (table: any) => {
      let predicate = () => true;
      const query: any = {
        where: (condition: any) => { predicate = condition; return query; },
        limit: () => query,
        for: (mode: string) => {
          if (!transactional) throw new Error("Lock outside transaction");
          state.locks.push(`${table.table}:${mode}`);
          // Simulate a concurrent submission committing before lock acquisition.
          if (state.submitBeforeLock) Object.assign(state.rows[0], { isDraft: false, firstName: "Submitted" });
          return query;
        },
        then: (resolve: any, reject: any) => Promise.resolve().then(() =>
          table.table === "internships" ? [{ publicationStatus: "Published" }] :
            state.rows.filter(predicate).map((row) => ({ ...row })),
        ).then(resolve, reject),
      };
      return query;
    } }),
    update: (table: any) => ({ set: (patch: any) => ({ where: async (predicate: any) => {
      if (!transactional) throw new Error("Mutation outside transaction");
      state.update(table.table, patch);
      for (const row of state.rows) if (predicate(row)) Object.assign(row, patch);
    } }) }),
    insert: () => ({ values: () => ({ onConflictDoNothing: () => ({ returning: async () => {
      if (!transactional) throw new Error("Mutation outside transaction");
      state.rows = [{ ...state.insertWinner }];
      return [];
    } }) }) }),
  });
  return { db: { ...client(), transaction: async (callback: any) => callback(client(true)) } };
});
vi.mock("@/lib/utils", () => ({ applicationRef: vi.fn(), appUrl: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/email/outbox", () => ({ enqueueEmail: vi.fn() }));
vi.mock("@/lib/email/provider", () => ({ adminAlertRecipients: vi.fn() }));

import { saveDraft } from "@/features/applications/service";
import { DomainError } from "@/lib/errors/domain-error";

const row = { id: "application", applicantUserId: "student", internshipId: "listing", isDraft: true, firstName: "Draft" };
const input = { userId: "student", internshipId: "listing", values: { firstName: "Stale save" } };

beforeEach(() => {
  state.rows = [{ ...row }];
  state.locks = [];
  state.submitBeforeLock = false;
  state.insertWinner = undefined;
  state.update.mockReset();
});

describe("saveDraft concurrency guards", () => {
  it("locks the draft row and rejects a submission that won the lock without overwriting it", async () => {
    state.submitBeforeLock = true;
    await expect(saveDraft(input)).rejects.toBeInstanceOf(DomainError);
    expect(state.locks).toEqual(["applications:update"]);
    expect(state.update).not.toHaveBeenCalled();
    expect(state.rows[0]).toMatchObject({ isDraft: false, firstName: "Submitted" });
  });

  it("updates a still-editable draft under the row lock", async () => {
    await expect(saveDraft(input)).resolves.toEqual({ applicationId: row.id, created: false });
    expect(state.locks).toEqual(["applications:update"]);
    expect(state.rows[0].firstName).toBe("Stale save");
  });

  it.each([true, false])("handles a lost insert race with winner isDraft=%s", async (isDraft) => {
    state.rows = [];
    state.insertWinner = { ...row, isDraft, firstName: "Winner" };
    const result = saveDraft(input);
    if (isDraft) await expect(result).resolves.toEqual({ applicationId: row.id, created: false });
    else await expect(result).rejects.toBeInstanceOf(DomainError);
    expect(state.update).not.toHaveBeenCalled();
    expect(state.rows[0]).toEqual(state.insertWinner);
  });
});
