// Local-only presentation fixtures. Re-running preserves existing demo records.
import "./load-env";
import { Client } from "pg";
import { getDocumentStore, validateUpload } from "../src/lib/storage/documents";
import { canTransition, type ApplicationStatus } from "../src/lib/workflow/transitions";

const ADMIN = "00000000-0000-0000-0000-00000000ad01";
const STUDENT = "00000000-0000-0000-0000-00000000ac01";
const SECOND_STUDENT = "00000000-0000-0000-0000-00000000aa01";
const connectionString = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

interface Scenario {
  id: string;
  slug: string;
  student?: string;
  path: ApplicationStatus[];
  age: number;
  statement: string;
  revision?: boolean;
  quote?: number;
  placement?: { organization: string; status: "Preparing" | "Confirmed" | "Completed" };
}

const scenarios: Scenario[] = [
  { id: "11111111-1111-4111-8111-111111111111", slug: "marketing-bangkok", path: ["New", "In Review"], age: 4,
    statement: "I coordinated our faculty's hospitality career fair and managed its social media campaign. I would like to develop campaign planning and guest engagement skills in a regional team." },
  { id: "22222222-2222-4222-8222-222222222222", slug: "f-and-b-singapore", path: ["New", "In Review", "Quotation Sent"], age: 12, quote: 185000,
    statement: "My part-time experience at a campus cafe includes guest service, stock checks and event catering. I am available for the full placement and keen to learn hotel restaurant operations." },
  { id: "33333333-3333-4333-8333-333333333333", slug: "finance-penang", path: ["New", "In Review"], age: 8, revision: true,
    statement: "I have completed accounting and revenue management modules and use Excel for budget reporting. My university has confirmed the placement dates; I have updated my availability accordingly." },
  { id: "44444444-4444-4444-8444-444444444444", slug: "hotel-operations-singapore", path: ["New", "In Review", "Quotation Sent", "Accepted"], age: 24, quote: 210000,
    statement: "I am specialising in hospitality operations and recently supported guest registration at a university conference. I want to build confidence in front-office systems and service recovery.",
    placement: { organization: "Marina Bay Hotel (demo)", status: "Confirmed" } },
  { id: "55555555-5555-4555-8555-555555555555", slug: "ui-design-remote-sg", path: [], age: 2,
    statement: "I am exploring how service design improves hotel booking experiences. I will add my student project portfolio before submitting this application." },
  { id: "77777777-7777-4777-8777-777777777777", slug: "demo-guest-services-singapore", path: ["New", "In Review", "Quotation Sent", "Accepted", "Completed"], age: 240, quote: 165000,
    statement: "My university-approved placement focused on guest services, reception and coordinating with housekeeping. I completed the programme and received feedback from my supervisor.",
    placement: { organization: "Orchard Garden Hotel (demo)", status: "Completed" } },
  { id: "88888888-8888-4888-8888-888888888888", slug: "software-engineering-kuala-lumpur", student: SECOND_STUDENT, path: ["New"], age: 1,
    statement: "I built a TypeScript campus events app with a team of three and wrote tests for the booking flow. I am interested in product engineering, code review and working with a mentor." },
  { id: "99999999-9999-4999-8999-999999999999", slug: "ui-design-remote-sg", student: SECOND_STUDENT, path: ["New", "In Review", "Rejected"], age: 18,
    statement: "My coursework includes interaction design and a Figma prototype for student accommodation. I would like feedback on my portfolio and exposure to a professional design team." },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", slug: "finance-penang", student: SECOND_STUDENT, path: [], age: 3,
    statement: "I am considering a data-focused finance placement and will confirm whether it meets my faculty's internship criteria before submitting." },
];

/** A real, readable one-page PDF, with byte-accurate cross-reference offsets. */
function cvPdf(name: string, course: string): Buffer {
  const lines = [name, "Fictional demo CV - Jalanin presentation data", course,
    "Education: Universitas Indonesia | Expected graduation: 2027",
    "Experience: Campus events volunteer; student project team member",
    "Skills: English communication, teamwork, Excel, customer service",
    "Available for a university-approved six-month internship."];
  const stream = `BT /F1 18 Tf 50 780 Td ${lines.map((line, i) =>
    `${i ? "0 -30 Td /F1 11 Tf " : ""}(${line.replace(/[\\()]/g, "\\$&")}) Tj`).join("\n")} ET`;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = Buffer.byteLength(pdf);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

async function main(): Promise<void> {
  if (!connectionString) throw new Error("Set DATABASE_URL or SUPABASE_DB_URL. See .env.example.");
  const host = new URL(connectionString).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (process.env.NODE_ENV === "production" || !["localhost", "127.0.0.1", "::1"].includes(host)) {
    throw new Error("Demo seeding requires a local development database.");
  }
  if ((process.env.STORAGE_BACKEND ?? "local") !== "local") throw new Error("Demo CVs require STORAGE_BACKEND=local.");
  const client = new Client({ connectionString });
  const store = getDocumentStore();
  const uploaded: string[] = [];
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(20261012)");
    const admin = await client.query("SELECT 1 FROM admin_users WHERE user_id = $1 AND active", [ADMIN]);
    if (!admin.rowCount) throw new Error(`Provision the demo admin first: pnpm admin:grant ${ADMIN}`);
    await client.query(`INSERT INTO profiles (user_id, display_name) VALUES
      ($1, 'Amina Rahman'), ($2, 'Rizky Pratama'), ($3, 'Jalanin Demo Coordinator') ON CONFLICT (user_id) DO NOTHING`,
    [STUDENT, SECOND_STUDENT, ADMIN]);
    await client.query(`INSERT INTO internships (slug, title, city, country_code, category_id, start_date, end_date,
      description, responsibilities, requirements, publication_status, published_at)
      SELECT 'demo-guest-services-singapore', 'Guest Services Intern (previous intake)', 'Singapore', 'SG', id,
        '2026-03-01', '2026-08-31', 'Fictional previous intake for the completed student journey.',
        'Support reception, guest enquiries and housekeeping coordination.', 'Hospitality student; six-month availability.', 'Unpublished', now() - interval '260 days'
      FROM categories WHERE slug = 'hospitality' ON CONFLICT (slug) DO NOTHING`);

    for (const scenario of scenarios) {
      const listing = await client.query("SELECT * FROM internships WHERE slug = $1", [scenario.slug]);
      const internship = listing.rows[0];
      if (!internship) throw new Error(`Missing ${scenario.slug}. Run pnpm db:seed first.`);
      const student = scenario.student ?? STUDENT;
      const secondary = student === SECOND_STUDENT;
      const first = secondary ? "Rizky" : "Amina";
      const last = secondary ? "Pratama" : "Rahman";
      const course = secondary ? "Computer Science" : "Business Administration - Hospitality Management";
      const draft = scenario.path.length === 0;
      const submitted = new Date(Date.now() - scenario.age * 86400000);
      const eventDate = (index: number) => scenario.placement?.status === "Completed" && index >= 4
        ? new Date("2026-09-02T09:00:00Z") : new Date(submitted.getTime() + index * 86400000);
      for (let index = 0; index < scenario.path.length; index++) {
        const check = canTransition({ from: scenario.path[index - 1] ?? null, to: scenario.path[index],
          actor: index === 0 ? "student" : "admin", needsReReview: false,
          hasValidQuotation: !!scenario.quote, revisionReviewed: true });
        if (!check.ok) throw new Error(check.reason);
      }
      // Preserve records modified during the demo; never reset student/admin work.
      const inserted = await client.query(`INSERT INTO applications
        (id, internship_id, applicant_user_id, first_name, last_name, email, nationality, university, course,
        graduation_year, preferred_start, preferred_end, additional_information, lifecycle_status, is_draft,
        submitted_at, revision, reviewed_revision, needs_re_review, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,'Indonesian','Universitas Indonesia',$7,2027,$8,$9,$10,$11,$12,$13,$14,1,$15,$16,$17)
        ON CONFLICT DO NOTHING RETURNING id`, [scenario.id, internship.id, student, first, last,
        `${first.toLowerCase()}.${last.toLowerCase()}@example.com`, course, internship.start_date, internship.end_date,
        scenario.statement, scenario.path.at(-1) ?? "New", draft, draft ? null : submitted,
        scenario.revision ? 2 : 1, !!scenario.revision, submitted, eventDate(scenario.path.length)]);
      if (!inserted.rowCount) continue;

      if (!draft) {
        const filename = `${first}_${last}_CV.pdf`;
        const bytes = cvPdf(`${first} ${last}`, course);
        const validation = validateUpload({ filename, mimeType: "application/pdf", bytes });
        if (!validation.ok) throw new Error(validation.error);
        const document = await store.put("cv.pdf", bytes, "application/pdf");
        uploaded.push(document.storagePath);
        await client.query(`INSERT INTO application_documents (application_id, storage_path, original_filename, mime_type, byte_size, uploaded_by, created_at)
          VALUES ($1,$2,$3,'application/pdf',$4,$5,$6)`, [scenario.id, document.storagePath, filename, bytes.length, student, submitted]);
        await client.query(`INSERT INTO consent_records (user_id, application_id, policy_type, policy_version, consented_at)
          SELECT $1,$2,policy_type,version,$3 FROM (SELECT DISTINCT ON (policy_type) policy_type, version
            FROM policy_versions ORDER BY policy_type, published_at DESC) current_policies`, [student, scenario.id, submitted]);
      }
      for (let index = 0; index < scenario.path.length; index++) {
        const to = scenario.path[index];
        const actor = index === 0 ? student : ADMIN;
        const reason = to === "Rejected" ? "Portfolio does not yet demonstrate the required UI design experience. Coordinator shared feedback for a future intake."
          : to === "Accepted" ? "Student confirmed by email; coordinator recorded the outcome (demo reference DEMO-2026-014)."
          : to === "Completed" ? "Coordinator reviewed the supervisor's final feedback and manually marked the application completed."
          : index === 0 ? "Student submitted the application and consented to the current policies." : "Coordinator reviewed application details.";
        await client.query(`INSERT INTO application_status_events (application_id, from_status, to_status, actor_user_id, reason, created_at)
          VALUES ($1,$2,$3,$4,$5,$6)`, [scenario.id, scenario.path[index - 1] ?? null, to, actor, reason, eventDate(index)]);
        await client.query(`INSERT INTO audit_events (actor_user_id, entity_type, entity_id, action, changes, created_at)
          VALUES ($1,'application',$2,$3,$4,$5)`, [actor, scenario.id, `transition: ${scenario.path[index - 1] ?? "Draft"} → ${to}`,
          JSON.stringify({ reason }), eventDate(index)]);
      }
      if (scenario.quote) await client.query(`INSERT INTO quotations (application_id, amount_minor, currency, notes_student, notes_internal, created_by, created_at, sent_at)
        VALUES ($1,$2,'SGD',$3,$4,$5,$6,$6)`, [scenario.id, scenario.quote,
        "Programme coordination, pre-arrival orientation and placement support for the agreed internship period. Please reply to the coordinator by email to discuss or confirm the quotation.",
        "Fictional demo quotation. Coordinator checked programme details and student availability.", ADMIN, eventDate(2)]);
      if (scenario.revision) await client.query(`INSERT INTO application_revisions (application_id, revision, changed_fields, old_values, new_values, edited_by, created_at)
        VALUES ($1,2,ARRAY['additional_information'],$2,$3,$4,$5)`, [scenario.id,
        JSON.stringify({ additional_information: "I am awaiting confirmation of internship dates from my university." }),
        JSON.stringify({ additional_information: scenario.statement }), student, eventDate(3)]);
      if (!draft) await client.query(`INSERT INTO admin_notifications (application_id, event_key, event_type, is_read, created_at, read_at)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (event_key) DO NOTHING`, [scenario.id, `demo:${scenario.id}:${scenario.revision ? "revision:2" : "submitted"}`,
        scenario.revision ? "revision_re_review" : "new_application", scenario.path.length > 1 && !scenario.revision,
        scenario.revision ? eventDate(3) : submitted, scenario.path.length > 1 && !scenario.revision ? eventDate(1) : null]);
      if (scenario.placement) await client.query(`INSERT INTO placements (student_user_id, application_id, organization, role, country_code, start_date, end_date,
        placement_status, notes, created_by, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [student, scenario.id, scenario.placement.organization, internship.title, internship.country_code,
        internship.start_date, internship.end_date, scenario.placement.status,
        scenario.placement.status === "Completed" ? "Supervisor feedback received. Final programme check-in completed."
          : "Placement confirmed. Pre-arrival briefing scheduled; coordinator will share arrival instructions by email.",
        ADMIN, eventDate(3), scenario.placement.status === "Completed" ? new Date("2026-09-02T09:00:00Z") : eventDate(4)]);
    }
    await client.query("COMMIT");
    console.log("Demo ready: Amina (6 applications, 2 placements), Rizky (3 applications), private CVs, quotations and dated histories. Open /dev/login with E2E_MODE=1.");
  } catch (error) {
    await client.query("ROLLBACK");
    await Promise.all(uploaded.map((key) => store.remove(key)));
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
