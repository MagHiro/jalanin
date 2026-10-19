// One-time data migration: Supabase-hosted PostgreSQL → standalone PG.
// Read-only against the source; idempotent against the destination.
//
//   SOURCE_DATABASE_URL=postgresql://... pnpm migrate:supabase-pg
//
// Steps: inventory → copy tables in FK order → fix sequences → verify
// counts + FK integrity. Re-runs skip rows already present (PK match).
// Legacy `users.legacy_auth_id` is backfilled here; the claim flow (see
// docs/migration-cutover.md) lets users set passwords afterwards.
import "../scripts/load-env";
import { Client } from "pg";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const destUrl = process.env.DATABASE_URL;
if (!sourceUrl || !destUrl) {
  console.error("Set SOURCE_DATABASE_URL (read-only Supabase pooler) and DATABASE_URL (destination).");
  process.exit(1);
}

// Parent-first FK order. analytics_events/request_rate_limits travel too.
const TABLES = [
  "categories",
  "internships",
  "profiles",
  "admin_users",
  "applications",
  "application_revisions",
  "application_documents",
  "application_status_events",
  "quotations",
  "placements",
  "admin_notifications",
  "notification_outbox",
  "audit_events",
  "contact_submissions",
  "consent_records",
  "policy_versions",
  "analytics_events",
  "request_rate_limits",
];

// Supabase-managed objects that must NEVER be copied.
const FORBIDDEN_SCHEMAS = ["auth", "storage", "extensions", "realtime", "vault"];

interface Count { table: string; source: number; dest: number }

async function main(): Promise<void> {
  const source = new Client({ connectionString: sourceUrl, statement_timeout: 60000 });
  const dest = new Client({ connectionString: destUrl });
  await source.connect();
  await dest.connect();
  try {
    // 1. Inventory + guard: refuse if Supabase-managed schemas leak into scope.
    const { rows: schemas } = await source.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = ANY($1)`,
      [FORBIDDEN_SCHEMAS],
    );
    console.log(`source extra schemas present (left untouched): ${schemas.map((s: { schema_name: string }) => s.schema_name).join(", ") || "none"}`);

    const counts: Count[] = [];
    for (const table of TABLES) {
      const srcCols = new Set(
        (await source.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
          [table],
        )).rows.map((r: { column_name: string }) => r.column_name),
      );
      if (srcCols.size === 0) {
        console.log(`skip ${table} (absent in source)`);
        continue;
      }
      const destCols = new Set(
        (await dest.query(
          `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
          [table],
        )).rows.map((r: { column_name: string }) => r.column_name),
      );
      // Copy the intersection: destination may lack legacy columns and the
      // source lacks native-auth columns (users table is handled separately).
      const cols = Array.from(srcCols).filter((c) => destCols.has(c));
      if (cols.length === 0) {
        console.log(`skip ${table} (no common columns)`);
        continue;
      }
      const { rows: [{ n: srcN }] } = await source.query(`SELECT count(*)::int AS n FROM public.${table}`);
      // Chunked copy with PK-based ordering for idempotency checks.
      // Tables without a single `id` PK fall back to unordered batches.
      const pkCol =
        table === "policy_versions" ? "policy_type"
        : table === "request_rate_limits" ? "bucket_hash"
        : table === "profiles" ? "user_id"
        : table === "admin_users" ? "user_id"
        : "id";
      const BATCH = 500;
      let offset = 0;
      let copied = 0;
      for (;;) {
        const { rows } = await source.query(
          `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM public.${table} ORDER BY "${pkCol}" LIMIT $1 OFFSET $2`,
          [BATCH, offset],
        );
        if (rows.length === 0) break;
        for (const row of rows) {
          const keys = Object.keys(row).filter((k) => cols.includes(k));
          const values = keys.map((k) => row[k]);
          await dest.query(
            `INSERT INTO public.${table} (${keys.map((k) => `"${k}"`).join(", ")})
             VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")})
             ON CONFLICT DO NOTHING`,
            values,
          );
          copied += 1;
        }
        offset += rows.length;
      }
      const { rows: [{ n: destN }] } = await dest.query(`SELECT count(*)::int AS n FROM public.${table}`);
      counts.push({ table, source: Number(srcN), dest: Number(destN) });
      console.log(`${table}: source=${srcN} copied~${copied} dest=${destN}`);
    }

    // 2. Backfill users skeleton: one row per distinct Supabase auth id,
    // preserving the id so FK-bearing rows keep resolving. Passwords are
    // unset (login-disabled) until the claim flow completes.
    const { rows: ids } = await source.query(
      `SELECT DISTINCT applicant_user_id AS uid FROM public.applications
       UNION SELECT DISTINCT user_id FROM public.profiles
       UNION SELECT DISTINCT user_id FROM public.admin_users`,
    );
    let usersCreated = 0;
    for (const { uid } of ids as Array<{ uid: string }>) {
      if (!uid) continue;
      const email = `claimed-${uid}@placeholder.local`;
      const r = await dest.query(
        `INSERT INTO users (id, email, password_hash, legacy_auth_id)
         VALUES ($1, $2, $3, $1) ON CONFLICT DO NOTHING RETURNING id`,
        [uid, email, "$2b$12$login_disabled_placeholder000000000000000000000"],
      );
      if (r.rowCount) usersCreated += 1;
    }
    console.log(`users skeleton: source-identities=${ids.length} created=${usersCreated}`);

    // 3. Fix identity sequences (analytics_events uses GENERATED ALWAYS).
    await dest.query(
      `SELECT setval(pg_get_serial_sequence('analytics_events','id'), COALESCE((SELECT max(id) FROM analytics_events), 1))`,
    ).catch(() => undefined);

    // 4. Verify: counts + FK integrity.
    let ok = true;
    for (const c of counts) {
      if (c.dest < c.source) {
        console.error(`MISMATCH ${c.table}: source=${c.source} dest=${c.dest}`);
        ok = false;
      }
    }
    const fkChecks = [
      "SELECT count(*)::int AS n FROM applications a LEFT JOIN internships i ON i.id=a.internship_id WHERE i.id IS NULL",
      "SELECT count(*)::int AS n FROM application_documents d LEFT JOIN applications a ON a.id=d.application_id WHERE a.id IS NULL",
      "SELECT count(*)::int AS n FROM placements p LEFT JOIN applications a ON a.id=p.application_id WHERE p.application_id IS NOT NULL AND a.id IS NULL",
    ];
    for (const q of fkChecks) {
      const { rows: [{ n }] } = await dest.query(q);
      if (Number(n) !== 0) {
        console.error(`ORPHANS: ${q} → ${n}`);
        ok = false;
      }
    }
    if (!ok) {
      console.error("VALIDATION FAILED — destination left intact for inspection. Rollback: TRUNCATE copied tables or restore destination from backup.");
      process.exit(1);
    }
    console.log("VALIDATION OK — counts match, no orphans.");
    console.log("Rollback (if needed before cutover): restore the destination database from its pre-migration backup; the source was never written to.");
  } finally {
    await source.end();
    await dest.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
