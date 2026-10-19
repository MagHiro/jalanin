import { db } from "@/lib/db/client";
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
import { notificationOutbox } from "@/lib/db/schema";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { logServerError } from "@/lib/observability/logger";
import { getEmailProvider } from "./provider";
import { buildEmail } from "./dispatcher-templates";

/**
 * Enqueue an email exactly once per event_key. Concurrent callers racing on
 * the same key converge on a single row (UNIQUE + on-conflict-do-nothing).
 * If a transaction is supplied, enqueue must succeed inside that transaction
 * so both business state and its notification are committed atomically.
 */
export async function enqueueEmail(input: {
  eventKey: string;
  recipient: string;
  templateKey: string;
  payload: Record<string, unknown>;
  runAfterMinutes?: number;
}, tx?: Transaction): Promise<void> {
  const next = new Date(Date.now() + (input.runAfterMinutes ?? 0) * 60000);
  await (tx ?? db)
    .insert(notificationOutbox)
    .values({
      eventKey: input.eventKey,
      recipient: input.recipient,
      templateKey: input.templateKey,
      payload: input.payload,
      status: "queued",
      nextAttemptAt: next,
    })
    .onConflictDoNothing({ target: notificationOutbox.eventKey });
}

export interface DispatchOutcome {
  processed: number;
  sent: number;
  failed: number;
}

const MAX_ATTEMPTS = 8;
const LEASE_MS = 120_000;
const DISPATCH_BUDGET_MS = 45_000;
const SEND_TIMEOUT_MS = 10_000;
const COMPLETION_RESERVE_MS = 2_000;

/**
 * Bounded, sequential delivery with expiring claims. attemptCount + the exact
 * lease timestamp identify a claim generation; every completion is fenced.
 * SMTP is at-least-once: acceptance followed by a crash/timeout can duplicate
 * delivery on recovery. event_key deduplicates enqueue, not provider delivery.
 * The budget bounds provider waits/new work, not stalled database operations.
 */
export async function dispatchDueEmails(limit = 25): Promise<DispatchOutcome> {
  const deadline = Date.now() + DISPATCH_BUDGET_MS;
  const provider = getEmailProvider();
  const due = await db
    .select()
    .from(notificationOutbox)
    .where(
      and(
        eq(notificationOutbox.status, "queued"),
        lte(notificationOutbox.nextAttemptAt, new Date()),
      ),
    )
    .orderBy(asc(notificationOutbox.nextAttemptAt))
    .limit(Math.max(0, Math.min(100, Math.floor(limit))));

  let processed = 0;
  let sent = 0;
  let failed = 0;
  for (const row of due) {
    if (Date.now() + COMPLETION_RESERVE_MS >= deadline) break;
    const now = new Date();
    const eligible = and(
      eq(notificationOutbox.id, row.id),
      eq(notificationOutbox.status, "queued"),
      eq(notificationOutbox.attemptCount, row.attemptCount),
      lte(notificationOutbox.nextAttemptAt, now),
    );
    // A worker may have died during its last allowed send. Reap only after
    // its lease expires, without performing an unbounded ninth send.
    if (row.attemptCount >= MAX_ATTEMPTS) {
      const recovered = await db.update(notificationOutbox)
        .set({ status: "failed", error: "Attempt limit reached; last delivery outcome may be unknown." })
        .where(eligible).returning({ id: notificationOutbox.id });
      if (recovered.length) { processed += 1; failed += 1; }
      continue;
    }
    const generation = row.attemptCount + 1;
    const leaseUntil = new Date(now.getTime() + LEASE_MS);
    const claimed = await db
      .update(notificationOutbox)
      .set({
        attemptCount: generation,
        nextAttemptAt: leaseUntil,
      })
      .where(
        eligible,
      )
      .returning({ id: notificationOutbox.id });
    if (claimed.length === 0) continue;
    processed += 1;
    const ownsClaim = and(
      eq(notificationOutbox.id, row.id),
      eq(notificationOutbox.status, "queued"),
      eq(notificationOutbox.attemptCount, generation),
      eq(notificationOutbox.nextAttemptAt, leaseUntil),
      lte(sql`clock_timestamp()`, notificationOutbox.nextAttemptAt),
    );

    let built: ReturnType<typeof buildEmail> = null;
    try {
      built = buildEmail(row.templateKey, row.payload as Record<string, unknown>);
    } catch {
      logServerError("email.template.failed", new Error("Email template rendering failed."));
    }
    if (!built) {
      const completed = await db
        .update(notificationOutbox)
        .set({ status: "failed", error: "Unknown or invalid email template." })
        .where(ownsClaim).returning({ id: notificationOutbox.id });
      if (completed.length) failed += 1;
      continue;
    }
    // A provider exception must not abort the batch or leave a claimed row
    // without a diagnostic; normal failures follow the existing retry policy.
    let result: Awaited<ReturnType<typeof provider.send>>;
    try {
      const remaining = Math.min(deadline, leaseUntil.getTime()) - Date.now() - COMPLETION_RESERVE_MS;
      if (remaining <= 0) {
        throw new Error("Dispatch budget exhausted before send.");
      }
      result = await boundedSend(() => provider.send({
        to: row.recipient,
        subject: built.subject,
        text: built.text,
        html: built.html,
        replyTo: built.replyTo,
      }), Math.max(1, Math.min(SEND_TIMEOUT_MS, remaining)));
    } catch {
      const incidentId = logServerError("email.provider.failed", new Error("Email provider threw or timed out; delivery outcome may be unknown."));
      result = { ok: false, error: `Provider error (incident ${incidentId})` };
    }
    if (result.ok) {
      const completed = await db
        .update(notificationOutbox)
        .set({
          status: "sent",
          sentAt: new Date(),
          providerMessageId: result.providerMessageId,
          error: null,
        })
        .where(ownsClaim).returning({ id: notificationOutbox.id });
      if (completed.length) sent += 1;
    } else {
      // Provider text can contain recipients, credentials or message content.
      // Persist/log only our own diagnostic, never arbitrary provider strings.
      const incidentId = logServerError("email.delivery.failed", new Error("Email delivery failed or outcome unknown."));
      const completed = await db
        .update(notificationOutbox)
        .set({
          status: generation >= MAX_ATTEMPTS ? "failed" : "queued",
          error: `Delivery failed or outcome unknown (incident ${incidentId}).`,
          nextAttemptAt: new Date(Date.now() + backoffMs(row.attemptCount)),
        })
        .where(ownsClaim).returning({ id: notificationOutbox.id });
      if (completed.length) failed += 1;
    }
  }
  return { processed, sent, failed };
}

async function boundedSend<T>(send: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(send),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Email provider deadline exceeded.")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function backoffMs(attempt: number): number {
  // ~1m, 5m, 15m, 1h, capped at 6h.
  const steps = [60000, 300000, 900000, 3600000, 21600000];
  return steps[Math.min(attempt, steps.length - 1)];
}
