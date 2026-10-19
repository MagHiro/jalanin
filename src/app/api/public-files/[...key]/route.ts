import { NextResponse } from "next/server";
import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { publicDir } from "@/lib/storage/documents";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
};

// Public assets from the local filesystem (PUBLIC_UPLOAD_DIR). Only
// sanitized relative keys with an allowlisted extension are served; private
// files live under a different root and can never resolve here.
export async function GET(
  _request: Request,
  { params }: { params: { key?: string[] } },
) {
  const segments = params.key ?? [];
  if (segments.length === 0 || segments.length > 5) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  for (const seg of segments) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(seg) || seg.startsWith(".")) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
  }
  const ext = path.extname(segments[segments.length - 1]).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return NextResponse.json({ ok: false }, { status: 404 });
  const full = path.resolve(publicDir(), ...segments);
  if (!full.startsWith(publicDir() + path.sep)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  let stat;
  try {
    stat = await fs.stat(full);
    if (!stat.isFile()) throw new Error("not a file");
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return new NextResponse(Readable.toWeb(createReadStream(full)) as ReadableStream, {
    headers: {
      "content-type": mime,
      "content-length": String(stat.size),
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
