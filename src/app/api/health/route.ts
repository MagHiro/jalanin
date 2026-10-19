import { NextResponse } from "next/server";
import { Client } from "pg";

// Liveness + readiness: reports healthy ONLY when the required schema is
// present (migrations applied). The compose stack gates traffic on this.
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query("SELECT 1 FROM schema_migrations WHERE version = '0006_native_auth.sql'");
      // Private storage root must exist and be writable.
      const { promises: fs } = await import("node:fs");
      const { default: path } = await import("node:path");
      const dir = path.resolve(
        process.cwd(),
        process.env.PRIVATE_UPLOAD_DIR ?? "storage/private",
      );
      await fs.mkdir(dir, { recursive: true });
      await fs.access(dir);
    } finally {
      await client.end();
    }
    return NextResponse.json(
      { ok: true, uptimeMs: Date.now() - started },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
