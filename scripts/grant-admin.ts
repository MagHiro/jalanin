// Privileged admin provisioning (D19). Grants the admin role to a native
// application user, looked up by email or user id. NEVER exposed through
// the app UI or any client-callable endpoint.
// Usage: pnpm admin:grant <email-or-user-uuid> [--by <granter-uuid>]
import "./load-env";
import { Client } from "pg";

const identifier = process.argv[2];
if (!identifier) {
  console.error("Usage: pnpm admin:grant <email-or-user-uuid> [--by <granter-uuid>]");
  process.exit(1);
}
const byIndex = process.argv.indexOf("--by");
const grantedBy =
  byIndex >= 0 && /^[0-9a-f-]{36}$/i.test(process.argv[byIndex + 1] ?? "")
    ? process.argv[byIndex + 1]
    : null;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set DATABASE_URL. See .env.example.");
  process.exit(1);
}

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // Accept a user UUID directly or resolve an email (case-insensitive).
    let userId = identifier;
    if (!/^[0-9a-f-]{36}$/i.test(identifier)) {
      const found = await client.query(
        "SELECT id FROM users WHERE lower(email) = lower($1)",
        [identifier],
      );
      if (found.rowCount === 0) {
        console.error(`No user found for "${identifier}".`);
        process.exit(1);
      }
      userId = found.rows[0].id as string;
    } else {
      const found = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
      if (found.rowCount === 0) {
        console.error(`No user found for id "${userId}".`);
        process.exit(1);
      }
    }
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
