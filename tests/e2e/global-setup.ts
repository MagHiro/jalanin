import { Client } from "pg";

// Global setup: provision E2E identities + admin role before the suite runs
// (mirrors `pnpm admin:grant` + `pnpm db:seed:test`).
export default async function globalSetup(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://jalanin:local_password@127.0.0.1:5432/jalanin";
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Isolated slice: truncate user-data tables (seed listings preserved).
    await client.query(
      `TRUNCATE applications, application_revisions, application_documents,
       application_status_events, quotations, placements, admin_notifications,
       notification_outbox, audit_events, contact_submissions, consent_records,
       profiles, admin_users, user_tokens, user_sessions, users
       RESTART IDENTITY CASCADE`,
    );
    // Native E2E identities (login-disabled placeholder hashes; the
    // /api/dev/session seam mints real sessions for these ids).
    await client.query(
      `INSERT INTO users (id, email, password_hash, email_verified_at) VALUES
       ('00000000-0000-0000-0000-00000000ad01', 'e2e-admin@example.com',
        '$2b$12$e2eprovisioned0000000000000000000000000000000000000', now()),
       ('00000000-0000-0000-0000-00000000ac01', 'e2e-student-a@example.com',
        '$2b$12$e2eprovisioned0000000000000000000000000000000000001', now()),
       ('00000000-0000-0000-0000-00000000aa01', 'e2e-student-b@example.com',
        '$2b$12$e2eprovisioned0000000000000000000000000000000000002', now()),
       ('00000000-0000-0000-0000-00000000aa02', 'e2e-student-c@example.com',
        '$2b$12$e2eprovisioned0000000000000000000000000000000000003', now())
       ON CONFLICT (id) DO NOTHING`,
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
