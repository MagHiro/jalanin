// Email outbox dispatcher. Sends due rows via the configured provider with
// idempotent single-flight claims and backoff (see src/lib/email/outbox.ts).
// Local: pnpm email:dispatch. Production: POST /api/cron/dispatch-emails
// with CRON_SECRET (scheduled via Vercel Cron or equivalent).
import { dispatchDueEmails } from "../src/lib/email/outbox";

async function main(): Promise<void> {
  const outcome = await dispatchDueEmails();
  console.log(
    `dispatch complete: processed=${outcome.processed} sent=${outcome.sent} failed=${outcome.failed}`,
  );
  process.exit(outcome.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
