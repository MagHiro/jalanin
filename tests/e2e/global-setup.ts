import { Client } from "pg";

// Global setup: provision the E2E admin + deterministic internship ids before
// the suite runs (mirrors `pnpm admin:grant` + `pnpm db:seed:test`).
export default async function globalSetup(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://jalanin:jalanin@localhost:54322/jalanin";
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Isolated slice: truncate user-data tables (seed listings preserved).
    await client.query(
      `TRUNCATE applications, application_revisions, application_documents,
       application_status_events, quotations, placements, admin_notifications,
       notification_outbox, audit_events, contact_submissions, consent_records,
       profiles, admin_users RESTART IDENTITY CASCADE`,
    );
    await client.query(
      `INSERT INTO admin_users (user_id, active)
       VALUES ('00000000-0000-0000-0000-00000000ad01', TRUE)
       ON CONFLICT (user_id) DO UPDATE SET active = TRUE`,
    );
  } finally {
    await client.end();
  }
}
