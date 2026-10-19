import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashToken, newToken, verifyPassword, hashPassword } from "@/lib/auth/crypto";

describe("native auth crypto", () => {
  it("hashes and verifies bcrypt passwords", async () => {
    const hash = await hashPassword("correct-horse-123");
    expect(hash).not.toContain("correct-horse-123");
    expect(await verifyPassword("correct-horse-123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password-xyz", hash)).toBe(false);
  });

  it("rejects wrong passwords without throwing", async () => {
    expect(await verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });

  it("issues unique opaque tokens with stable SHA-256 hashes", () => {
    const a = newToken();
    const b = newToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).not.toBe(hashToken(b));
  });
});

describe("auth service (mocked db)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports session lifetime policy (7d default, 30d remembered)", async () => {
    const { sessionLifetimeMs } = await import("@/lib/auth/crypto");
    expect(sessionLifetimeMs(false)).toBe(7 * 24 * 60 * 60 * 1000);
    expect(sessionLifetimeMs(true)).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
