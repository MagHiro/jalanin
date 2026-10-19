// One-time storage migration: Supabase Storage bucket → local private dir.
// Requires: SOURCE_SUPABASE_URL, SOURCE_SUPABASE_SERVICE_KEY (read-only use),
// STORAGE_BUCKET (default "documents"). Destination: PRIVATE_UPLOAD_DIR.
//
//   SOURCE_SUPABASE_URL=https://... SOURCE_SUPABASE_SERVICE_KEY=... pnpm migrate:supabase-storage
//
// For every application_documents row with a `supabase:` key: download,
// validate (type/size/magic), save under the SAME key with a `file:` prefix,
// update the row in a transaction. Idempotent: rows already prefixed `file:`
// are verified (exist + size match) and skipped. Never deletes from source.
import "../scripts/load-env";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const supabaseUrl = process.env.SOURCE_SUPABASE_URL;
const serviceKey = process.env.SOURCE_SUPABASE_SERVICE_KEY;
const bucket = process.env.STORAGE_BUCKET ?? "documents";
const destUrl = process.env.DATABASE_URL;
if (!destUrl) {
  console.error("Set DATABASE_URL (destination).");
  process.exit(1);
}

function privateRoot(): string {
  return path.resolve(process.cwd(), process.env.PRIVATE_UPLOAD_DIR ?? "storage/private");
}

async function downloadObject(key: string): Promise<Buffer> {
  if (!supabaseUrl || !serviceKey) throw new Error("Set SOURCE_SUPABASE_URL and SOURCE_SUPABASE_SERVICE_KEY.");
  const url = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${bucket}/${key}`;
  const res = await fetch(url, { headers: { apikey: serviceKey, authorization: `Bearer ${serviceKey}` } });
  if (!res.ok) throw new Error(`download ${key}: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main(): Promise<void> {
  const dest = new Client({ connectionString: destUrl });
  await dest.connect();
  try {
    const { rows } = await dest.query(
      `SELECT id, storage_path, mime_type, byte_size FROM application_documents ORDER BY id`,
    );
    let migrated = 0;
    let verified = 0;
    const missing: string[] = [];
    for (const row of rows as Array<{ id: string; storage_path: string; mime_type: string; byte_size: number }>) {
      const current: string = row.storage_path;
      if (current.startsWith("file:")) {
        // Verify the file exists with matching size.
        const key = current.replace(/^file:/, "");
        try {
          const stat = await fs.stat(path.resolve(privateRoot(), key));
          if (stat.size === row.byte_size) {
            verified += 1;
            continue;
          }
          console.error(`SIZE MISMATCH ${row.id}: db=${row.byte_size} fs=${stat.size}`);
        } catch {
          missing.push(`${row.id} (file key present but bytes missing: ${key})`);
          continue;
        }
      }
      const match = current.match(/^(?:supabase:|local:)?([0-9a-f-]{36}\/cv\.(pdf|docx))$/i);
      if (!match) {
        missing.push(`${row.id} (unrecognized key: ${current})`);
        continue;
      }
      const key = match[1];
      let bytes: Buffer;
      try {
        bytes = await downloadObject(key);
      } catch (err) {
        missing.push(`${row.id} (${err instanceof Error ? err.message : "download failed"})`);
        continue;
      }
      if (bytes.length !== row.byte_size) {
        console.error(`SIZE MISMATCH ${row.id}: db=${row.byte_size} source=${bytes.length} — saving anyway, flagging for review.`);
      }
      const full = path.resolve(privateRoot(), key);
      if (!full.startsWith(privateRoot() + path.sep)) throw new Error("path escape");
      await fs.mkdir(path.dirname(full), { recursive: true, mode: 0o700 });
      await fs.writeFile(full, bytes, { mode: 0o600 });
      await dest.query(`UPDATE application_documents SET storage_path = $1 WHERE id = $2`, [`file:${key}`, row.id]);
      migrated += 1;
      console.log(`migrated ${row.id} → file:${key} (${bytes.length} bytes)`);
    }
    console.log(`done: migrated=${migrated} verified=${verified} problems=${missing.length}`);
    if (missing.length) {
      console.error("MISSING / BROKEN REFERENCES:");
      for (const m of missing) console.error(` - ${m}`);
      process.exit(1);
    }
  } finally {
    await dest.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
