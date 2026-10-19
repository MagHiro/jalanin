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
}

/** Resolve the private document root (outside the web-accessible tree). */
export function privateDir(): string {
  return path.resolve(
    process.cwd(),
    process.env.PRIVATE_UPLOAD_DIR ?? "storage/private",
  );
}

/** Resolve the public upload root (served, sanitized filenames only). */
export function publicDir(): string {
  return path.resolve(
    process.cwd(),
    process.env.PUBLIC_UPLOAD_DIR ?? "storage/public",
  );
}

const KEY_RE = /^[0-9a-f-]{36}\/cv\.(pdf|docx)$/i;

/** Filesystem store: private CVs under PRIVATE_UPLOAD_DIR (or legacy keys). */
class FilesystemDocumentStore implements DocumentStore {
  private fullPath(storagePath: string): string {
    // Accept current `file:` keys and legacy `local:`/`supabase:` keys so
    // rows written before cutover keep resolving after file migration.
    const key = storagePath.replace(/^(file|local|supabase):/, "");
    if (!KEY_RE.test(key)) {
      throw new Error("Invalid document storage key.");
    }
    const resolved = path.resolve(privateDir(), key);
    if (!resolved.startsWith(privateDir() + path.sep)) {
      throw new Error("Invalid document storage path.");
    }
    return resolved;
  }

  async put(objectName: string, bytes: Buffer): Promise<StoredDocument> {
    const key = `${randomUUID()}/${objectName}`;
    const full = this.fullPath(key);
    await fs.mkdir(path.dirname(full), { recursive: true, mode: 0o700 });
    // Write atomically: temp file + rename, restrictive mode, fsync.
    const tmp = `${full}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(tmp, bytes, { mode: 0o600 });
      const handle = await fs.open(tmp, "r");
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(tmp, full);
    } catch {
      await fs.rm(tmp, { force: true });
      throw new Error("Storage write failed.");
    }
    return { storagePath: `file:${key}` };
  }

  async get(storagePath: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.fullPath(storagePath));
    } catch {
      throw new Error("Document not found.");
    }
  }

  async remove(storagePath: string): Promise<void> {
    await fs.rm(this.fullPath(storagePath), { force: true });
  }
}

let cached: DocumentStore | null = null;

export function getDocumentStore(): DocumentStore {
  if (!cached) cached = new FilesystemDocumentStore();
  return cached;
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
  if (
    input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    (!input.bytes.includes(Buffer.from("[Content_Types].xml")) ||
      !input.bytes.includes(Buffer.from("word/document.xml")))
  ) {
    return { ok: false, error: "The DOCX archive is missing required Word entries." };
  }
  return { ok: true };
}

/** Sanitize a user filename for metadata display (never used as a key). */
export function safeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}
