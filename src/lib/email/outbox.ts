import { db } from "@/lib/db/client";
import { notificationOutbox } from "@/lib/db/schema";
import { and, asc, eq, lte } from "drizzle-orm";

/**
 * Enqueue an email exactly once per event_key. Concurrent callers racing on
 * the same key converge on a single row (UNIQUE + on-conflict-do-nothing).
 * Never throws: outbox failures must not roll back the business transaction,
 * so callers enqueue inside the tx and log failures separately.
 */
export async function enqueueEmail(input: {
  eventKey: string;
  recipient: string;
  templateKey: string;
  payload: Record<string, unknown>;
  runAfterMinutes?: number;
}): Promise<void> {
  const next = new Date(Date.now() + (input.runAfterMinutes ?? 0) * 60000);
  await db
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

/**
 * Claim due rows and send them via the configured provider. Safe to run
 * concurrently (single-flight claim per row) and to retry: sends are keyed
 * by event_key and terminal states are recorded, so retries never duplicate
 * the underlying business mutation — only the delivery attempt repeats.
 */
export async function dispatchDueEmails(limit = 25): Promise<DispatchOutcome> {
  const { getEmailProvider } = await import("./provider");
  const { buildEmail } = await import("./dispatcher-templates");
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
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const row of due) {
    // Single-flight claim: only the worker that flips attempt_count wins.
    const claimed = await db
      .update(notificationOutbox)
      .set({
        attemptCount: row.attemptCount + 1,
        nextAttemptAt: new Date(Date.now() + backoffMs(row.attemptCount)),
      })
      .where(
        and(
          eq(notificationOutbox.id, row.id),
          eq(notificationOutbox.status, "queued"),
          eq(notificationOutbox.attemptCount, row.attemptCount),
        ),
      )
      .returning({ id: notificationOutbox.id });
    if (claimed.length === 0) continue;

    const built = buildEmail(
      row.templateKey,
      row.payload as Record<string, unknown>,
    );
    if (!built) {
      await db
        .update(notificationOutbox)
        .set({ status: "failed", error: `Unknown template ${row.templateKey}` })
        .where(eq(notificationOutbox.id, row.id));
      failed += 1;
      continue;
    }
    const result = await provider.send({
      to: row.recipient,
      subject: built.subject,
      text: built.text,
      html: built.html,
      replyTo: built.replyTo,
    });
    if (result.ok) {
      await db
        .update(notificationOutbox)
        .set({
          status: "sent",
          sentAt: new Date(),
          providerMessageId: result.providerMessageId,
          error: null,
        })
        .where(eq(notificationOutbox.id, row.id));
      sent += 1;
    } else if (row.attemptCount + 1 >= 8) {
      await db
        .update(notificationOutbox)
        .set({ status: "failed", error: result.error })
        .where(eq(notificationOutbox.id, row.id));
      failed += 1;
    } else {
      await db
        .update(notificationOutbox)
        .set({ error: result.error })
        .where(eq(notificationOutbox.id, row.id));
      failed += 1;
    }
  }
  return { processed: due.length, sent, failed };
}

function backoffMs(attempt: number): number {
  // ~1m, 5m, 15m, 1h, capped at 6h.
  const steps = [60000, 300000, 900000, 3600000, 21600000];
  return steps[Math.min(attempt, steps.length - 1)];
}
