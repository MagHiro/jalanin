import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StoredDocument {
  /** Opaque path/key used for later retrieval (never a user filename). */
  storagePath: string;
}

export interface DocumentStore {
  put(objectName: string, bytes: Buffer, mimeType: string): Promise<StoredDocument>;
  get(storagePath: string): Promise<Buffer>;
  remove(storagePath: string): Promise<void>;
  /** Short-lived authorized download reference (URL or tokenized path). */
  createSignedDownload(storagePath: string, filename: string): Promise<string>;
}

/** Filesystem backend for local development (STORAGE_BACKEND=local). */
class LocalDocumentStore implements DocumentStore {
  private dir: string;

  constructor() {
    this.dir = path.resolve(
      process.cwd(),
      process.env.STORAGE_LOCAL_DIR ?? ".storage-local",
    );
  }

  private fullPath(storagePath: string): string {
    // Prevent path traversal: storagePath is `<uuid>/<uuid>.<ext>`.
    const normalized = path.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");
    return path.join(this.dir, normalized);
  }

  async put(objectName: string, bytes: Buffer): Promise<StoredDocument> {
    const key = `${randomUUID()}/${objectName}`;
    const full = this.fullPath(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    return { storagePath: `local:${key}` };
  }

  async get(storagePath: string): Promise<Buffer> {
    return fs.readFile(this.fullPath(storagePath.replace(/^local:/, "")));
  }

  async remove(storagePath: string): Promise<void> {
    await fs.rm(this.fullPath(storagePath.replace(/^local:/, "")), {
      force: true,
    });
  }

  async createSignedDownload(storagePath: string): Promise<string> {
    return `/api/documents/download?path=${encodeURIComponent(storagePath)}`;
  }
}

/** Supabase private-bucket backend (STORAGE_BACKEND=supabase, prod). */
class SupabaseDocumentStore implements DocumentStore {
  private bucket(): string {
    return process.env.STORAGE_BUCKET ?? "documents";
  }

  private serviceClient() {
    // Lazy + server-only: service-role key must never reach the browser.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase storage is not configured.");
    return createClient(url, key);
  }

  async put(objectName: string, bytes: Buffer, mimeType: string): Promise<StoredDocument> {
    const key = `${randomUUID()}/${objectName}`;
    const { error } = await this.serviceClient()
      .storage.from(this.bucket())
      .upload(key, bytes, { contentType: mimeType, upsert: false });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return { storagePath: `supabase:${key}` };
  }

  async get(storagePath: string): Promise<Buffer> {
    const { data, error } = await this.serviceClient()
      .storage.from(this.bucket())
      .download(storagePath.replace(/^supabase:/, ""));
    if (error || !data) throw new Error("Storage download failed.");
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(storagePath: string): Promise<void> {
    await this.serviceClient()
      .storage.from(this.bucket())
      .remove([storagePath.replace(/^supabase:/, "")]);
  }

  async createSignedDownload(storagePath: string): Promise<string> {
    const { data, error } = await this.serviceClient()
      .storage.from(this.bucket())
      .createSignedUrl(storagePath.replace(/^supabase:/, ""), 60);
    if (error || !data?.signedUrl) throw new Error("Could not sign download URL.");
    return data.signedUrl;
  }
}

export function getDocumentStore(): DocumentStore {
  const backend = (process.env.STORAGE_BACKEND ?? "local").toLowerCase();
  if (backend === "supabase") return new SupabaseDocumentStore();
  return new LocalDocumentStore();
}

// ---- Upload validation (interim operational config, NOT a confirmed
// product requirement — see docs/open-decisions.md B05). ----

export function cvPolicy(): {
  allowedMime: string[];
  allowedExt: string[];
  maxBytes: number;
} {
  return {
    allowedMime: (process.env.ALLOWED_CV_MIME ??
      "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      .split(",")
      .map((s) => s.trim()),
    allowedExt: (process.env.ALLOWED_CV_EXT ?? ".pdf,.docx")
      .split(",")
      .map((s) => s.trim().toLowerCase()),
    maxBytes: Number(process.env.MAX_CV_BYTES ?? 5 * 1024 * 1024),
  };
}

const MAGIC: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    [0x50, 0x4b, 0x03, 0x04], // PK.. (zip container)
  ],
};

export function validateUpload(input: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
}): { ok: boolean; error?: string } {
  const policy = cvPolicy();
  const ext = `.${(input.filename.split(".").pop() ?? "").toLowerCase()}`;
  if (!policy.allowedExt.includes(ext)) {
    return { ok: false, error: `File type ${ext} is not allowed. Use ${policy.allowedExt.join(", ")}.` };
  }
  if (!policy.allowedMime.includes(input.mimeType)) {
    return { ok: false, error: "File type is not allowed." };
  }
  if (input.bytes.length === 0 || input.bytes.length > policy.maxBytes) {
    return {
      ok: false,
      error: `File must be non-empty and at most ${Math.round(policy.maxBytes / 1024 / 1024)} MB.`,
    };
  }
  // Magic-byte check defeats naive extension/MIME spoofing.
  const signatures = MAGIC[input.mimeType] ?? [];
  const matches = signatures.some((sig) =>
    sig.every((b, i) => input.bytes[i] === b),
  );
  if (!matches) {
    return { ok: false, error: "File contents do not match the declared type." };
  }
  return { ok: true };
}

/** Sanitize a user filename for metadata display (never used as a key). */
export function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}
