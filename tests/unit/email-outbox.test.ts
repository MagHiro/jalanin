/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic Drizzle predicate/chain test double */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Model UPDATE predicates against live state, while SELECT returns snapshots.
// This deliberately exercises the predicates rather than returning canned wins.
const state = vi.hoisted(() => ({
  rows: [] as Array<Record<string, any>>,
  send: vi.fn(), log: vi.fn(() => "incident"),
  beforeUpdate: undefined as undefined | (() => void),
}));
vi.mock("@/lib/db/schema", () => ({ notificationOutbox: new Proxy({}, { get: (_, key) => key }) }));
vi.mock("drizzle-orm", () => {
  const value = (operand: any, row: any) => operand?.clock ? new Date() : typeof operand === "string" && operand in row ? row[operand] : operand;
  return {
    eq: (a: any, b: any) => (row: any) => +value(a, row) === +value(b, row) || value(a, row) === value(b, row),
    lte: (a: any, b: any) => (row: any) => value(a, row) <= value(b, row),
    and: (...predicates: any[]) => (row: any) => predicates.every((predicate) => predicate(row)),
    asc: (column: any) => column,
    sql: () => ({ clock: true }),
  };
});
vi.mock("@/lib/db/client", () => ({ db: {
  select: () => ({ from: () => ({ where: (predicate: any) => ({ orderBy: () => ({
    limit: async (limit: number) => state.rows.filter(predicate).slice(0, limit).map((row) => ({ ...row })),
  }) }) }) }),
  update: () => ({ set: (patch: any) => ({ where: (predicate: any) => ({ returning: async () => {
    state.beforeUpdate?.();
    const matches = state.rows.filter(predicate);
    matches.forEach((row) => Object.assign(row, patch));
    return matches.map(({ id }) => ({ id }));
  } }) }) }),
} }));
vi.mock("../../src/lib/email/provider", () => ({ getEmailProvider: () => ({ name: "test", send: state.send }) }));
vi.mock("../../src/lib/email/dispatcher-templates", () => ({ buildEmail: () => ({ subject: "subject", text: "text", html: "html" }) }));
vi.mock("@/lib/observability/logger", () => ({ logServerError: state.log }));

import { dispatchDueEmails } from "@/lib/email/outbox";

function row(attemptCount = 0, id = "row") {
  return { id, status: "queued", attemptCount, nextAttemptAt: new Date(Date.now() - 1), recipient: "private@example.com", templateKey: "test", payload: {} };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  state.rows = [row()];
  state.beforeUpdate = undefined;
  state.send.mockReset().mockResolvedValue({ ok: true });
  state.log.mockClear();
});
afterEach(() => vi.useRealTimers());

describe("outbox claims and recovery", () => {
  it("allows only one of two competing snapshot claims and counts actual claims", async () => {
    const outcomes = await Promise.all([dispatchDueEmails(), dispatchDueEmails()]);
    expect(state.send).toHaveBeenCalledTimes(1);
    expect(outcomes.reduce((sum, outcome) => sum + outcome.processed, 0)).toBe(1);
    expect(outcomes.reduce((sum, outcome) => sum + outcome.sent, 0)).toBe(1);
  });

  it("does not claim a snapshot whose due timestamp was moved by another worker", async () => {
    state.beforeUpdate = () => {
      state.beforeUpdate = undefined;
      state.rows[0].nextAttemptAt = new Date(Date.now() + 60_000);
    };
    expect(await dispatchDueEmails()).toEqual({ processed: 0, sent: 0, failed: 0 });
    expect(state.send).not.toHaveBeenCalled();
  });

  it("uses a two-minute lease, separately schedules retry after a throw, and sanitizes errors", async () => {
    state.send.mockImplementation(async () => {
      expect(state.rows[0].nextAttemptAt.getTime() - Date.now()).toBe(120_000);
      throw new Error("secret password private@example.com");
    });
    expect(await dispatchDueEmails()).toEqual({ processed: 1, sent: 0, failed: 1 });
    expect(state.rows[0]).toMatchObject({ status: "queued", attemptCount: 1 });
    expect(state.rows[0].nextAttemptAt.getTime() - Date.now()).toBe(60_000);
    expect(JSON.stringify(state.log.mock.calls)).not.toContain("private@example.com");
    expect(state.rows[0].error).not.toContain("secret");
  });

  it("times out a hung provider and ignores its late success", async () => {
    let resolve!: (result: any) => void;
    state.send.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const dispatch = dispatchDueEmails();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await dispatch).toEqual({ processed: 1, sent: 0, failed: 1 });
    resolve({ ok: true });
    await Promise.resolve();
    expect(state.rows[0].status).toBe("queued");
  });

  it("recovers an expired interrupted claim but waits for a live lease", async () => {
    state.rows[0] = row(3);
    state.rows[0].nextAttemptAt = new Date(Date.now() + 120_000);
    expect((await dispatchDueEmails()).processed).toBe(0);
    await vi.advanceTimersByTimeAsync(120_001);
    expect(await dispatchDueEmails()).toEqual({ processed: 1, sent: 1, failed: 0 });
    expect(state.rows[0].attemptCount).toBe(4);
  });

  it("reaps an interrupted exhausted attempt without sending a ninth time", async () => {
    state.rows = [row(8)];
    expect(await dispatchDueEmails()).toEqual({ processed: 1, sent: 0, failed: 1 });
    expect(state.rows[0].status).toBe("failed");
    expect(state.send).not.toHaveBeenCalled();
  });

  it("terminally fails the eighth unsuccessful send without storing provider text", async () => {
    state.rows = [row(7)];
    state.send.mockResolvedValue({ ok: false, error: "private@example.com password" });
    expect((await dispatchDueEmails()).failed).toBe(1);
    expect(state.rows[0]).toMatchObject({ status: "failed", attemptCount: 8 });
    expect(state.rows[0].error).not.toContain("password");
  });

  it.each([true, false])("fences stale completion (success=%s) after a replacement claim", async (ok) => {
    state.send.mockImplementation(async () => {
      state.rows[0].attemptCount = 2;
      state.rows[0].nextAttemptAt = new Date(Date.now() + 120_001);
      return { ok };
    });
    expect(await dispatchDueEmails()).toEqual({ processed: 1, sent: 0, failed: 0 });
    expect(state.rows[0]).toMatchObject({ status: "queued", attemptCount: 2 });
  });

  it("bounds total provider waiting and stops claiming once the invocation budget is spent", async () => {
    state.rows = Array.from({ length: 25 }, (_, index) => row(0, `row-${index}`));
    state.send.mockImplementation(() => new Promise(() => {}));
    const dispatch = dispatchDueEmails();
    await vi.advanceTimersByTimeAsync(45_000);
    expect(await dispatch).toEqual({ processed: 5, sent: 0, failed: 5 });
    expect(state.send).toHaveBeenCalledTimes(5);
    expect(state.rows[5].attemptCount).toBe(0);
  });
});
