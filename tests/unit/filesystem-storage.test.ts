import { describe, expect, it, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  getDocumentStore,
  privateDir,
  publicDir,
  safeFilename,
  validateUpload,
} from "@/lib/storage/documents";

// Isolate filesystem side effects: point both roots at fresh temp dirs so
// unit runs never touch the developer's storage/ tree.
beforeAll(() => {
  process.env.PRIVATE_UPLOAD_DIR = mkdtempSync(path.join(tmpdir(), "jl-priv-"));
  process.env.PUBLIC_UPLOAD_DIR = mkdtempSync(path.join(tmpdir(), "jl-pub-"));
});

const PDF = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]),
  Buffer.from("trailer-bytes"),
]);

describe("filesystem document storage", () => {
  it("keeps private files outside the public web tree", () => {
    // Isolated roots (beforeAll) already prove the security property:
    // distinct roots, neither inside a `public/` tree. Defaults are
    // covered by asserting the documented relative layout resolves apart.
    expect(privateDir()).not.toContain(`${path.sep}public${path.sep}`);
    expect(privateDir()).not.toBe(publicDir());
    expect(path.resolve(privateDir())).not.toBe(path.resolve(publicDir()));
    const cwd = process.cwd();
    const savedPriv = process.env.PRIVATE_UPLOAD_DIR;
    const savedPub = process.env.PUBLIC_UPLOAD_DIR;
    delete process.env.PRIVATE_UPLOAD_DIR;
    delete process.env.PUBLIC_UPLOAD_DIR;
    try {
      expect(privateDir()).toBe(path.resolve(cwd, "storage/private"));
      expect(publicDir()).toBe(path.resolve(cwd, "storage/public"));
    } finally {
      if (savedPriv !== undefined) process.env.PRIVATE_UPLOAD_DIR = savedPriv;
      if (savedPub !== undefined) process.env.PUBLIC_UPLOAD_DIR = savedPub;
    }
  });

  it("round-trips private documents with opaque file: keys", async () => {
    const store = getDocumentStore();
    const stored = await store.put("cv.pdf", PDF, "application/pdf");
    expect(stored.storagePath).toMatch(/^file:[0-9a-f-]{36}\/cv\.pdf$/i);
    expect(await store.get(stored.storagePath)).toEqual(PDF);
    await store.remove(stored.storagePath);
    await expect(store.get(stored.storagePath)).rejects.toThrow();
  });

  it("resolves legacy local:/supabase: keys after file migration", async () => {
    const store = getDocumentStore();
    const stored = await store.put("cv.pdf", PDF, "application/pdf");
    const key = stored.storagePath.replace(/^file:/, "");
    for (const prefix of ["local:", "supabase:"]) {
      expect(await store.get(`${prefix}${key}`)).toEqual(PDF);
    }
    await store.remove(stored.storagePath);
  });

  it("rejects path traversal keys", async () => {
    const store = getDocumentStore();
    for (const bad of [
      "file:../../etc/passwd",
      "file:/abs/cv.pdf",
      "file:00000000-0000-0000-0000-000000000000/cv.exe",
      "file:00000000-0000-0000-0000-000000000000/../x.pdf",
    ]) {
      // Reads fail generically (no path oracle); deletes fail on the key.
      await expect(store.get(bad)).rejects.toThrow(/Invalid document|Document not found/);
      await expect(store.remove(bad)).rejects.toThrow(/Invalid document/);
    }
  });

  it("validates CV type/size/magic bytes", () => {
    expect(validateUpload({ filename: "cv.pdf", mimeType: "application/pdf", bytes: PDF }).ok).toBe(true);
    expect(validateUpload({ filename: "cv.exe", mimeType: "application/pdf", bytes: PDF }).ok).toBe(false);
    expect(validateUpload({ filename: "cv.pdf", mimeType: "image/png", bytes: PDF }).ok).toBe(false);
    expect(validateUpload({ filename: "cv.pdf", mimeType: "application/pdf", bytes: Buffer.from("MZ") }).ok).toBe(false);
    expect(validateUpload({ filename: "cv.pdf", mimeType: "application/pdf", bytes: Buffer.alloc(0) }).ok).toBe(false);
  });

  it("sanitizes display filenames", () => {
    expect(safeFilename("../../../etc/passwd")).not.toContain("/");
    expect(safeFilename("My CV (final).pdf")).toBe("My_CV__final_.pdf");
  });
});
