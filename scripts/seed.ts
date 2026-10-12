// Deterministic development seed runner. Loads supabase/seed.sql.
// Flags: --test truncates user-data tables first for isolated test runs.
// Usage: pnpm db:seed | pnpm db:seed:test
import "./load-env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const connectionString =
  process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set SUPABASE_DB_URL or DATABASE_URL. See .env.example.");
  process.exit(1);
}

const testMode = process.argv.includes("--test");

// Test seeding truncates user data: NEVER run this against hosted Supabase,
// even if a developer accidentally leaves the dev project's URL in .env.local.
if (testMode) {
  const host = new URL(connectionString).hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(
      "Refusing destructive db:seed:test against a remote PostgreSQL server. " +
        "Use an isolated local Docker database for test seeding.",
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    if (testMode) {
      await client.query(
        `TRUNCATE applications, application_revisions, application_documents,
         application_status_events, quotations, placements, admin_notifications,
         notification_outbox, audit_events, contact_submissions, consent_records,
         profiles, admin_users RESTART IDENTITY CASCADE`,
      );
    }
    const sql = readFileSync(
      path.join(process.cwd(), "supabase", "seed.sql"),
      "utf8",
    );
    await client.query(sql);
    console.log(testMode ? "test seed complete" : "seed complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
