import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { applicationDocuments, applications } from "@/lib/db/schema";
import { getSessionUser, isAdminUser } from "@/lib/auth/require";
import { getDocumentStore } from "@/lib/storage/documents";
import { eq } from "drizzle-orm";

// Authorized document download. Admin-only by default (PRD §8.1 [D]):
// the student's own download of a submitted CV is denied unless B05 approves
// it. Local backend streams bytes after checks; Supabase backend redirects to
// a 60-second signed URL.
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
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

  const admin = await isAdminUser(user.id);
  if (!admin) {
    // Default-deny for students (explicit policy exception pending, B05).
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { document } = rows[0];
  const store = getDocumentStore();
  if ((process.env.STORAGE_BACKEND ?? "local") === "supabase") {
    const url = await store.createSignedDownload(document.storagePath, document.originalFilename);
    return NextResponse.redirect(url);
  }
  const bytes = await store.get(document.storagePath);
  return new NextResponse(bytes, {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `attachment; filename="${document.originalFilename}"`,
      "cache-control": "private, no-store",
    },
  });
}
