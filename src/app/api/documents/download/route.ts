import { NextResponse } from "next/server";
import { createReadStream, promises as fs } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { db } from "@/lib/db/client";
import { applicationDocuments, applications } from "@/lib/db/schema";
import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { privateDir } from "@/lib/storage/documents";
import { logServerError } from "@/lib/observability/logger";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Authorized private-document download. Admin-only by default (PRD §8.1 [D]):
// the student's own download of a submitted CV is denied unless B05 approves
// it. Streams bytes from PRIVATE_UPLOAD_DIR after authorization — never from
// the public web tree.
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Authorization before lookup prevents document-id enumeration.
  const admin = await isAdminUser(user.id);
  if (!admin) return NextResponse.json({ ok: false }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const rows = await db
    .select({ document: applicationDocuments, application: applications })
    .from(applicationDocuments)
    .innerJoin(applications, eq(applicationDocuments.applicationId, applications.id))
    .where(eq(applicationDocuments.id, documentId))
    .limit(1);
  if (rows.length === 0) return NextResponse.json({ ok: false }, { status: 404 });

  const { document } = rows[0];
  // Resolve inside the private root to guarantee no public-tree escape, then
  // stream without buffering whole files in memory.
  const key = document.storagePath.replace(/^(file|local|supabase):/, "");
  if (!/^[0-9a-f-]{36}\/cv\.(pdf|docx)$/i.test(key)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const full = path.resolve(privateDir(), key);
  if (!full.startsWith(privateDir() + path.sep)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  let stat;
  try {
    stat = await fs.stat(full);
    if (!stat.isFile()) throw new Error("not a file");
  } catch {
    const incidentId = logServerError("document.download.missing", null, {
      documentId,
    });
    return NextResponse.json(
      { ok: false, error: "Document is unavailable.", incidentId },
      { status: 404 },
    );
  }
  if (stat.size !== document.byteSize) {
    logServerError("document.download.size_mismatch", null, { documentId });
  }
  const stream = Readable.toWeb(createReadStream(full));
  const safeName = document.originalFilename.replace(/["\r\n]/g, "_");
  return new NextResponse(stream as ReadableStream, {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename="${safeName}"`,
      "content-length": String(stat.size),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
