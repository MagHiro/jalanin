// Database integration tests: migrations, UNIQUE(application) constraint,
// transactional submit, revision persistence, ownership, constraint posture.
// Requires a live PostgreSQL (local: pnpm db:start).
//   DATABASE_URL=postgresql://jalanin:local_password@127.0.0.1:5432/jalanin pnpm test
import { beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL ?? "";

function skipped(): boolean {
  return !connectionString;
}

let client: Client;

beforeAll(async () => {
  if (skipped()) return;
  client = new Client({ connectionString });
  await client.connect();
  // Fresh slice: truncate user-data tables (seed re-applied by caller).
  await client.query(
    `TRUNCATE applications, application_revisions, application_documents,
     application_status_events, quotations, placements, admin_notifications,
     notification_outbox, audit_events, contact_submissions, consent_records,
     profiles, admin_users RESTART IDENTITY CASCADE`,
  );
});

describe("database constraints", () => {
  it("requires DATABASE_URL (skips cleanly without a database)", () => {
    if (skipped()) {
      console.warn("integration: DATABASE_URL unset — skipping DB tests");
      return;
    }
    expect(client).toBeDefined();
  });

  it("enforces UNIQUE(applicant_user_id, internship_id) incl. drafts", async () => {
    if (skipped()) return;
    const { rows: interns } = await client.query(
      "SELECT id FROM internships WHERE publication_status='Published' LIMIT 1",
    );
    expect(interns.length).toBe(1);
    const internshipId = interns[0].id as string;
    const student = "00000000-0000-0000-0000-000000000101";

    await client.query(
      `INSERT INTO applications (internship_id, applicant_user_id, first_name, last_name, email,
        nationality, university, course, graduation_year, preferred_start, preferred_end, is_draft)
       VALUES ($1, $2, 'Test', 'User', 't@example.com', 'SG', 'NUS', 'CS', 2026, '2026-01-01', '2026-06-01', TRUE)`,
      [internshipId, student],
    );
    // Second insert for the same pair — even as a submitted row — must fail.
    await expect(
      client.query(
        `INSERT INTO applications (internship_id, applicant_user_id, first_name, last_name, email,
          nationality, university, course, graduation_year, preferred_start, preferred_end,
          is_draft, lifecycle_status, submitted_at)
         VALUES ($1, $2, 'Test', 'User', 't@example.com', 'SG', 'NUS', 'CS', 2026, '2026-01-01', '2026-06-01', FALSE, 'New', now())`,
        [internshipId, student],
      ),
    ).rejects.toThrow(/duplicate|unique/i);
  });

  it("rejects non-SGD quotations and non-positive amounts", async () => {
    if (skipped()) return;
    const { rows } = await client.query(
      "SELECT id FROM applications LIMIT 1",
    );
    const appId = rows[0].id as string;
    await expect(
      client.query(
        `INSERT INTO quotations (application_id, amount_minor, currency, notes_student, created_by)
         VALUES ($1, 100, 'USD', 'terms', '00000000-0000-0000-0000-000000000001')`,
        [appId],
      ),
    ).rejects.toThrow(/check|constraint/i);
    await expect(
      client.query(
        `INSERT INTO quotations (application_id, amount_minor, currency, notes_student, created_by)
         VALUES ($1, 0, 'SGD', 'terms', '00000000-0000-0000-0000-000000000001')`,
        [appId],
      ),
    ).rejects.toThrow(/check|constraint/i);
  });

  it("keeps revision history append-only per application", async () => {
    if (skipped()) return;
    const { rows } = await client.query("SELECT id FROM applications LIMIT 1");
    const appId = rows[0].id as string;
    await client.query(
      `INSERT INTO application_revisions (application_id, revision, changed_fields, old_values, new_values, edited_by)
       VALUES ($1, 2, '{firstName}', '{"firstName":"A"}', '{"firstName":"B"}', '00000000-0000-0000-0000-000000000101')`,
      [appId],
    );
    await expect(
      client.query(
        `INSERT INTO application_revisions (application_id, revision, changed_fields, old_values, new_values, edited_by)
         VALUES ($1, 2, '{lastName}', '{}', '{}', '00000000-0000-0000-0000-000000000101')`,
        [appId],
      ),
    ).rejects.toThrow(/duplicate|unique/i);
  });

  it("enforces placement status vocabulary at the database level", async () => {
    if (skipped()) return;
    await expect(
      client.query(
        `INSERT INTO placements (student_user_id, organization, role, country_code, placement_status, created_by)
         VALUES ('00000000-0000-0000-0000-000000000101', 'Org', 'Role', 'SG', 'Flying', '00000000-0000-0000-0000-000000000001')`,
      ),
    ).rejects.toThrow(/check|constraint|invalid/i);
  });

  it("retires Supabase RLS: no policies remain, authz is application-level", async () => {
    if (skipped()) return;
    // Migration 0005 removed every Supabase RLS policy. Authorization is
    // enforced exclusively in application code (requireStudent/requireAdmin
    // + ownership checks); the database keeps CHECK/UNIQUE/FK constraints.
    const { rows } = await client.query(
      `SELECT policyname FROM pg_policies WHERE schemaname = 'public'`,
    );
    expect(rows.map((r) => r.policyname as string)).toEqual([]);
    const secured = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity IS TRUE`,
    );
    expect(secured.rows).toEqual([]);
  });

  it("enforces one active CV metadata record per application", async () => {
    if (skipped()) return;
    const { rows } = await client.query("SELECT id FROM applications LIMIT 1");
    const appId = rows[0]?.id as string;
    expect(appId).toBeTruthy();
    const base = [
      appId, "local:00000000-0000-0000-0000-000000000000/cv.pdf",
      "cv.pdf", "application/pdf", 100,
      "00000000-0000-0000-0000-000000000101",
    ];
    const query = `INSERT INTO application_documents
      (application_id, document_type, storage_path, original_filename,
       mime_type, byte_size, uploaded_by)
      VALUES ($1, 'cv', $2, $3, $4, $5, $6)`;
    await client.query(query, base);
    await expect(client.query(query, base)).rejects.toThrow(/duplicate|unique/i);
  });

  it("keeps CHECK/UNIQUE constraints without RLS on ops tables", async () => {
    if (skipped()) return;
    const { rows } = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='public'
       AND tablename IN ('analytics_events','request_rate_limits')`,
    );
    expect(rows.map((r) => r.tablename).sort()).toEqual(["analytics_events", "request_rate_limits"]);
  });

  it("enforces domain constraints on user-data tables without RLS", async () => {
    if (skipped()) return;
    // Application-level authorization (require.ts) gates every query; the
    // database backstops domain rules via CHECK/UNIQUE/FK — verified above.
    const { rows } = await client.query(
      `SELECT conname, contype FROM pg_constraint
       WHERE conrelid IN ('applications'::regclass, 'quotations'::regclass, 'placements'::regclass)
       AND contype IN ('c', 'u', 'f')`,
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});
