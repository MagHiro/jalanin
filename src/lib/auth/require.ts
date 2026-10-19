import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { logServerError } from "@/lib/observability/logger";
import { readSessionCookie } from "./session";
import { validateSessionToken, type AuthUser } from "./service";

export interface SessionUser {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
}

/** Typed auth failure. Pages translate 401→login redirect, 403→not-found. */
export class AuthError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
  }
}

/** Whether the E2E/test session seam is active (local/CI only, never prod). */
export function isE2EMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.E2E_MODE === "1";
}

const E2E_COOKIE = "e2e_session";

function e2eSecret(): string {
  return process.env.CRON_SECRET ?? "local-dev-cron-secret-change-me";
}

export function signE2ESession(userId: string): string {
  const sig = createHmac("sha256", e2eSecret()).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function verifyE2ESession(value: string): string | null {
  const [userId, sig] = value.split(".");
  if (!userId || !sig) return null;
  const expected = createHmac("sha256", e2eSecret()).update(userId).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return userId;
}

async function devSession(): Promise<SessionUser | null> {
  // E2E/dev seam ONLY — never active unless E2E_MODE=1 (local/CI test runs).
  if (!isE2EMode()) return null;
  const h = headers();
  const headerId = h.get("x-e2e-user-id");
  if (headerId) {
    return { id: headerId, email: h.get("x-e2e-user-email"), emailConfirmed: true };
  }
  const cookie = cookies().get(E2E_COOKIE)?.value;
  if (cookie) {
    const userId = verifyE2ESession(cookie);
    if (userId) return { id: userId, email: null, emailConfirmed: true };
  }
  return null;
}

function toSessionUser(user: AuthUser): SessionUser {
  return { id: user.id, email: user.email, emailConfirmed: user.emailVerified };
}

/** Resolve the current session user, or null when unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const dev = await devSession();
  if (dev) return dev;
  try {
    const token = readSessionCookie();
    if (!token) return null;
    const user = await validateSessionToken(token);
    return user ? toSessionUser(user) : null;
  } catch (error) {
    // Next's static-render probe intentionally throws when cookies are read.
    // Re-throw its control signal so rendering becomes dynamic, not an incident.
    if (error instanceof Error && "digest" in error && error.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    logServerError("auth.session.lookup.failed", error);
    return null;
  }
}

/** Require any authenticated student. Throws AuthError(401) when absent. */
export async function requireStudent(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError(401, "Authentication required.");
  }
  return user;
}

/**
 * Require an authorized admin (D19). Role comes ONLY from the admin_users
 * table — never from client-provided claims, metadata, or form fields.
 * Throws AuthError(401/403) when absent.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401, "Authentication required.");
  if (!(await isAdminUser(user.id))) {
    throw new AuthError(403, "Forbidden: admin access required.");
  }
  return user;
}

/** Whether the given user id holds the active admin role. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const rows = await db
    .select({ active: adminUsers.active })
    .from(adminUsers)
    .where(eq(adminUsers.userId, userId))
    .limit(1);
  return rows.length > 0 && rows[0].active === true;
}
