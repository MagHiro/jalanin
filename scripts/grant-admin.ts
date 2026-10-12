// Privileged admin provisioning (D19). Grants the single admin role to an
// existing Supabase Auth user id. Requires the service-role key and is
// NEVER exposed through the app UI or any client-callable endpoint.
// Usage: SUPABASE_SERVICE_ROLE_KEY=... pnpm admin:grant <auth-user-uuid> [--by <granter-uuid>]
import { Client } from "pg";

const userId = process.argv[2];
if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
  console.error("Usage: pnpm admin:grant <auth-user-uuid> [--by <granter-uuid>]");
  process.exit(1);
}
const byIndex = process.argv.indexOf("--by");
const grantedBy =
  byIndex >= 0 && /^[0-9a-f-]{36}$/i.test(process.argv[byIndex + 1] ?? "")
    ? process.argv[byIndex + 1]
    : null;

const connectionString =
  process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set SUPABASE_DB_URL or DATABASE_URL. See .env.example.");
  process.exit(1);
}

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO admin_users (user_id, active, granted_by)
       VALUES ($1, TRUE, $2)
       ON CONFLICT (user_id) DO UPDATE SET active = TRUE, granted_by = EXCLUDED.granted_by, granted_at = now()`,
      [userId, grantedBy],
    );
    console.log(`granted admin role to ${userId}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
