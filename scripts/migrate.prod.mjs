// Production migration entrypoint (runs inside the one-off `migrate`
// container). Applies db/migrations in order with the same runner as local
// development, so local and production converge on identical SQL.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import pkg from "pg";
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const dir = "/app/db/migrations";
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
    );
    const { rows } = await client.query("SELECT version FROM schema_migrations");
    const applied = new Set(rows.map((r) => r.version));
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip  ${file} (already applied)`);
        continue;
      }
      console.log(`apply ${file}`);
      const sql = readFileSync(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
    console.log("migrations complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
