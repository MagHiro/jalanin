/* eslint-disable @typescript-eslint/no-explicit-any -- stateful Drizzle service test double */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";

const state = vi.hoisted(() => ({
  tables: {} as Record<string, any[]>,
  locks: [] as string[],
}));

vi.mock("@/lib/db/schema", () => Object.fromEntries(
  ["contactSubmissions", "auditEvents"].map((name) => [
    name,
    new Proxy({ table: name }, {
      get: (target, key) => (key === "table" ? target.table : `${name}.${String(key)}`),
    }),
  ]),
));

vi.mock("drizzle-orm", () => ({
  eq: (column: string, value: any) => (row: any) => row[column.split(".")[1]] === value,
  and: (...conditions: any[]) => (row: any) => conditions.every((c) => (typeof c === "function" ? c(row) : true)),
  or: (...conditions: any[]) => (row: any) => conditions.some((c) => (typeof c === "function" ? c(row) : true)),
  asc: (column: string) => `asc:${column}`,
  desc: (column: string) => `desc:${column}`,
  count: () => "count",
  ilike: (column: string, value: any) => {
    const needle = String(value).replace(/%/g, "").toLowerCase();
    return (row: any) => String(row[column.split(".")[1]] ?? "").toLowerCase().includes(needle);
  },
}));

vi.mock("@/lib/db/client", () => {
  function client(transactional = false): any {
    return {
      select: (projection?: any) => ({
        from: (table: any) => {
          let predicate: any = () => true;
          let limit = Infinity;
          let offset = 0;
          const execute = () => {
            const rows = (state.tables[table.table] ?? []).filter(predicate);
            if (projection?.n === "count") return [{ n: rows.length }];
            return rows.slice(offset, offset + limit).map((row) => ({ ...row }));
          };
          const query: any = {
            where: (c: any) => { predicate = c ?? (() => true); return query; },
            limit: (v: number) => { limit = v; return query; },
            offset: (v: number) => { offset = v; return query; },
            orderBy: (..._o: string[]) => query,
            for: (mode: string) => {
              if (!transactional) throw new Error("Lock outside transaction");
              state.locks.push(`${table.table}:${mode}`);
              return query;
            },
            then: (resolve: any, reject: any) => Promise.resolve().then(execute).then(resolve, reject),
          };
          return query;
        },
      }),
      update: (table: any) => ({
        set: (patch: any) => ({
          where: async (predicate: any) => {
            if (!transactional) throw new Error("Mutation outside transaction");
            for (const row of state.tables[table.table] ?? []) if (predicate(row)) Object.assign(row, patch);
          },
        }),
      }),
      insert: (table: any) => ({
        values: (values: any) => {
          const execute = () => {
            if (!transactional) throw new Error("Mutation outside transaction");
            const rows = (state.tables[table.table] ??= []);
            rows.push({ id: `created-${rows.length}`, ...values });
            return [rows[rows.length - 1]];
          };
          return {
            returning: async () => execute(),
            then: (resolve: any, reject: any) => Promise.resolve().then(execute).then(resolve, reject),
          };
        },
      }),
    };
  }
  return {
    db: {
      ...client(),
      transaction: (callback: any) => {
        const before = structuredClone(state.tables);
        return Promise.resolve()
          .then(() => callback(client(true)))
          .catch((error) => { state.tables = before; throw error; });
      },
    },
  };
});

vi.mock("@/lib/utils", () => ({
  singleCount: (rows: any[]) => Number(rows[0]?.n ?? 0),
  audit: async (event: any, tx: any) => {
    const { auditEvents } = await import("@/lib/db/schema");
    await tx.insert(auditEvents).values(event);
  },
}));

import { listAdminContacts, setContactHandling } from "@/features/admin/service";

const c1 = "00000000-0000-4000-8000-000000000001";
const c2 = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  state.tables = {
    contactSubmissions: [
      { id: c1, name: "Kim", email: "kim@example.com", subject: "Fees", message: "Hello", handlingStatus: "Open", createdAt: new Date("2026-10-01") },
      { id: c2, name: "Lee", email: "lee@example.com", subject: "Dates", message: "Hi", handlingStatus: "Handled", createdAt: new Date("2026-10-02") },
    ],
  };
  state.locks = [];
});

describe("contact handling transitions (A3 — audited, history preserved)", () => {
  it("marks an open enquiry handled and audits the transition", async () => {
    await setContactHandling({ adminId: "admin", contactId: c1, handled: true });
    expect(state.tables.contactSubmissions.find((r) => r.id === c1)).toMatchObject({ handlingStatus: "Handled" });
    expect(state.tables.contactSubmissions.find((r) => r.id === c1).handledAt).toBeInstanceOf(Date);
    expect(state.tables.auditEvents[0]).toMatchObject({ action: "contact-handled", entityId: c1 });
    expect(state.locks).toEqual(["contactSubmissions:update"]);
  });

  it("reopens a handled enquiry without deleting history", async () => {
    await setContactHandling({ adminId: "admin", contactId: c2, handled: false });
    expect(state.tables.contactSubmissions.find((r) => r.id === c2)).toMatchObject({ handlingStatus: "Open", handledAt: null });
    expect(state.tables.auditEvents[0]).toMatchObject({ action: "contact-reopened" });
    // Message content is untouched.
    expect(state.tables.contactSubmissions.find((r) => r.id === c2).message).toBe("Hi");
  });

  it("rejects unknown enquiries with a safe business error and no writes", async () => {
    const before = structuredClone(state.tables);
    await expect(setContactHandling({ adminId: "admin", contactId: "missing", handled: true })).rejects.toBeInstanceOf(DomainError);
    expect(state.tables).toEqual(before);
  });
});

describe("contact list filtering (A3 — All / Open / Handled)", () => {
  it("filters by handling state and reports live counts", async () => {
    const open = await listAdminContacts({ handling: "open", page: 1, pageSize: 50 });
    expect(open.rows.map((r: any) => r.id)).toEqual([c1]);
    expect(open.openCount).toBe(1);
    expect(open.handledCount).toBe(1);
    const handled = await listAdminContacts({ handling: "handled", page: 1, pageSize: 50 });
    expect(handled.rows.map((r: any) => r.id)).toEqual([c2]);
    const all = await listAdminContacts({ handling: "all", page: 1, pageSize: 50 });
    expect(all.total).toBe(2);
  });

  it("searches sender, email and subject", async () => {
    const rows = await listAdminContacts({ q: "fees", page: 1, pageSize: 50 });
    expect(rows.rows.map((r: any) => r.id)).toEqual([c1]);
  });
});
