// Temporary local-dev demo data seeder (NOT part of the product).
// Populates realistic applications, quotations, revisions, placements,
// notifications, and audit events for the two demo personas used by
// /dev/login + /dev/enter. Safe to re-run (idempotent by fixed UUIDs).
// Delete before production.
import { Client } from "pg";

const ADMIN = "00000000-0000-0000-0000-00000000ad01";
const STUDENT = "00000000-0000-0000-0000-00000000ac01";
const DRAFTER = "00000000-0000-0000-0000-00000000aa01";

const APPS = {
  review: "11111111-1111-4111-8111-111111111111",
  quote: "22222222-2222-4222-8222-222222222222",
  rereview: "33333333-3333-4333-8333-333333333333",
  accepted: "44444444-4444-4444-8444-444444444444",
  draft: "55555555-5555-4555-8555-555555555555",
};

async function main(): Promise<void> {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL,
  });
  await client.connect();
  try {
    const interns = await client.query(
      `SELECT id, slug FROM internships WHERE publication_status = 'Published' ORDER BY slug LIMIT 5`,
    );
    if (interns.rows.length < 5) throw new Error("Run pnpm db:seed first (need 5 published internships).");
    const [i1, i2, i3, i4, i5] = interns.rows.map((r: { id: string }) => r.id);

    await client.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, 'Amina Rahman'), ($2, 'E2E Student'), ($3, 'Jalanin Admin')
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name`,
      [STUDENT, DRAFTER, ADMIN],
    );
    await client.query(
      `INSERT INTO admin_users (user_id, active) VALUES ($1, TRUE)
       ON CONFLICT (user_id) DO UPDATE SET active = TRUE`,
      [ADMIN],
    );

    const app = async (
      id: string, internshipId: string, student: string,
      first: string, last: string, email: string, status: string,
      opts: { draft?: boolean; revision?: number; reviewed?: number; rereview?: boolean; submittedDaysAgo?: number } = {},
    ) => {
      const rev = opts.revision ?? 1;
      const submitted = opts.draft ? null : `now() - interval '${opts.submittedDaysAgo ?? 3} days'`;
      await client.query(
        `INSERT INTO applications (id, internship_id, applicant_user_id, first_name, last_name, email, nationality, university, course, graduation_year, preferred_start, preferred_end, additional_information, lifecycle_status, is_draft, submitted_at, revision, reviewed_revision, needs_re_review)
         VALUES ($1,$2,$3,$4,$5,$6,'Indonesian','Universitas Indonesia','Hospitality Management',2026,'2026-11-01','2027-04-01','Excited to learn front-office operations and guest services.', $7, $8, ${opts.draft ? "NULL" : submitted}, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET lifecycle_status = EXCLUDED.lifecycle_status, is_draft = EXCLUDED.is_draft, revision = EXCLUDED.revision, reviewed_revision = EXCLUDED.reviewed_revision, needs_re_review = EXCLUDED.needs_re_review, updated_at = now()`,
        [id, internshipId, student, first, last, email, status, opts.draft ?? false, rev, opts.reviewed ?? rev, opts.rereview ?? false],
      );
    };

    await app(APPS.review, i1, STUDENT, "Amina", "Rahman", "amina@example.com", "In Review", { submittedDaysAgo: 4 });
    await app(APPS.quote, i2, STUDENT, "Amina", "Rahman", "amina@example.com", "Quotation Sent", { submittedDaysAgo: 9 });
    await app(APPS.rereview, i3, STUDENT, "Amina", "Rahman", "amina@example.com", "In Review", { revision: 2, reviewed: 1, rereview: true, submittedDaysAgo: 6 });
    await app(APPS.accepted, i4, STUDENT, "Amina", "Rahman", "amina@example.com", "Accepted", { submittedDaysAgo: 20 });
    await app(APPS.draft, i5, DRAFTER, "E2E", "Student", "e2e-student@example.com", "New", { draft: true });

    await client.query(
      `INSERT INTO quotations (application_id, amount_minor, currency, notes_student, notes_internal, created_by, sent_at, revision)
       VALUES ($1, 185000, 'SGD', 'Programme coordination, orientation, and placement support across the full internship period.', 'Margin check passed. Coordinator: S. Lim.', $2, now() - interval '2 days', 1)
       ON CONFLICT (application_id, revision) DO NOTHING`,
      [APPS.quote, ADMIN],
    );
    await client.query(
      `INSERT INTO application_revisions (application_id, revision, changed_fields, old_values, new_values, edited_by)
       VALUES ($1, 2, ARRAY['preferred_start','preferred_end','additional_information'], '{"preferred_start":"2026-11-01"}', '{"preferred_start":"2026-12-01"}', $2)
       ON CONFLICT (application_id, revision) DO NOTHING`,
      [APPS.rereview, STUDENT],
    );
    await client.query(
      `INSERT INTO placements (id, student_user_id, application_id, organization, role, country_code, start_date, end_date, placement_status, notes, created_by)
       VALUES ('66666666-6666-4666-8666-666666666666', $1, $2, 'Marina Bay Hotel', 'Front Office Intern', 'SG', '2026-11-01', '2027-04-30', 'Confirmed', 'Welcome pack sent. Arrival briefing on 1 Nov.', $3)
       ON CONFLICT (id) DO UPDATE SET placement_status = 'Confirmed', updated_at = now()`,
      [STUDENT, APPS.accepted, ADMIN],
    );
    await client.query(
      `INSERT INTO admin_notifications (application_id, event_key, event_type, is_read)
       VALUES ($1, 'dev-new-app-review', 'new_application', FALSE), ($2, 'dev-rereview', 'revision_re_review', FALSE)
       ON CONFLICT (event_key) DO NOTHING`,
      [APPS.review, APPS.rereview],
    );
    const events: Array<[string, string | null, string]> = [
      [APPS.review, null, "New"],
      [APPS.review, "New", "In Review"],
      [APPS.quote, null, "New"],
      [APPS.quote, "New", "In Review"],
      [APPS.quote, "In Review", "Quotation Sent"],
      [APPS.rereview, null, "New"],
      [APPS.rereview, "New", "In Review"],
      [APPS.accepted, null, "New"],
      [APPS.accepted, "New", "In Review"],
      [APPS.accepted, "In Review", "Quotation Sent"],
      [APPS.accepted, "Quotation Sent", "Accepted"],
    ];
    for (const [appId, from, to] of events) {
      await client.query(
        `INSERT INTO application_status_events (application_id, from_status, to_status, actor_user_id, reason)
         SELECT $1::uuid, $2::varchar, $3::varchar, $4::uuid, 'Demo data'
         WHERE NOT EXISTS (SELECT 1 FROM application_status_events WHERE application_id = $1::uuid AND to_status = $3::varchar AND COALESCE(from_status,'') = COALESCE($2::varchar,''))`,
        [appId, from, to, ADMIN],
      );
    }
    await client.query(
      `INSERT INTO audit_events (actor_user_id, entity_type, entity_id, action) VALUES
       ($1, 'application', $2, 'transition: New → In Review'),
       ($1, 'application', $3, 'quotation sent: SGD 1,850.00'),
       ($1, 'placement', '66666666-6666-4666-8666-666666666666', 'placement confirmed')`,
      [ADMIN, APPS.review, APPS.quote],
    );
    await client.query(
      `INSERT INTO contact_submissions (name, email, subject, message) VALUES
       ('Daniel Tan', 'daniel@example.com', 'Availability for January intake', 'Hello! Are January placements in Singapore still open?'),
       ('Siti Ahmad', 'siti@example.com', NULL, 'What documents do I need besides my CV?')`,
    );
    console.log("demo data ready: admin + student(Amina, 4 apps) + drafter + placement + quote + notifications");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
