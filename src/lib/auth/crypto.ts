import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

/** bcrypt cost factor: ~250ms per hash on commodity hardware. */
const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  // bcrypt.compare is timing-safe over the hash comparison.
  return bcrypt.compare(password, hash).catch(() => false);
}

/** Opaque session/reset token (256-bit, base64url for cookie/URL safety). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex of a token — what is stored; the raw token never is. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function sessionLifetimeMs(remember: boolean): number {
  // 7 days default; 30 days with "remember me". Absolute expiry — no sliding.
  return (remember ? 30 : 7) * 24 * 60 * 60 * 1000;
}

export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
