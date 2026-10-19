import "server-only";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, userSessions, userTokens } from "@/lib/db/schema";
import {
  PASSWORD_RESET_TTL_MS,
  VERIFY_EMAIL_TTL_MS,
  hashPassword,
  hashToken,
  newToken,
  sessionLifetimeMs,
  verifyPassword,
} from "./crypto";
import { enqueueEmail } from "@/lib/email/outbox";
import { appUrl } from "@/lib/utils";

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export class AuthServiceError extends Error {
  readonly code:
    | "invalid_credentials"
    | "email_taken"
    | "invalid_token"
    | "expired_token"
    | "rate_limited";
  constructor(
    code: AuthServiceError["code"],
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerifiedAt !== null,
  };
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);
  return rows.length ? toAuthUser(rows[0]) : null;
}

export async function createUser(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; verificationToken: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    // Generic error at the route layer prevents account enumeration.
    throw new AuthServiceError("email_taken", "Could not create the account.");
  }
  const [row] = await db
    .insert(users)
    .values({ email: input.email, passwordHash: await hashPassword(input.password) })
    .returning();
  const token = newToken();
  await db.insert(userTokens).values({
    userId: row.id,
    purpose: "verify_email",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFY_EMAIL_TTL_MS),
  });
  await enqueueEmail({
    eventKey: `verify-email:${row.id}:${hashToken(token).slice(0, 16)}`,
    recipient: row.email,
    templateKey: "verify-email",
    payload: { verifyUrl: appUrl(`/auth/verify?token=${token}`) },
  });
  return { user: toAuthUser(row), verificationToken: token };
}

export async function verifyEmailToken(token: string): Promise<AuthUser> {
  const [row] = await db
    .select({ token: userTokens, user: users })
    .from(userTokens)
    .innerJoin(users, eq(userTokens.userId, users.id))
    .where(
      and(
        eq(userTokens.purpose, "verify_email"),
        eq(userTokens.tokenHash, hashToken(token)),
        isNull(userTokens.consumedAt),
      ),
    )
    .limit(1);
  if (!row) throw new AuthServiceError("invalid_token", "The verification link is invalid.");
  if (row.token.expiresAt.getTime() < Date.now()) {
    throw new AuthServiceError("expired_token", "The verification link has expired.");
  }
  await db.transaction(async (tx) => {
    await tx
      .update(userTokens)
      .set({ consumedAt: new Date() })
      .where(eq(userTokens.id, row.token.id));
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, row.user.id));
  });
  return { ...toAuthUser(row.user), emailVerified: true };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthUser> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
    .limit(1);
  const row = rows[0];
  // Constant-shape failure: same work + same message whether the email or
  // the password is wrong.
  const ok = row ? await verifyPassword(password, row.passwordHash) : false;
  if (!row || !ok) {
    // Burn comparable time for unknown emails to blunt enumeration timing.
    if (!row) await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvali");
    throw new AuthServiceError("invalid_credentials", "Email or password is incorrect.");
  }
  return toAuthUser(row);
}

export async function createSession(
  userId: string,
  input: { remember?: boolean; userAgent?: string } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + sessionLifetimeMs(input.remember ?? false));
  // Bound concurrent sessions; prune expired rows opportunistically.
  await db.delete(userSessions).where(
    and(eq(userSessions.userId, userId), lt(userSessions.expiresAt, new Date())),
  );
  const count = await db
    .select({ id: userSessions.id, createdAt: userSessions.createdAt })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
  if (count.length >= 10) {
    const oldest = [...count]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, count.length - 9)
      .map((r) => r.id);
    for (const id of oldest) {
      await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.id, id));
    }
  }
  await db.insert(userSessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: input.userAgent?.slice(0, 300) ?? null,
  });
  return { token, expiresAt };
}

export async function validateSessionToken(
  token: string,
): Promise<AuthUser | null> {
  const [row] = await db
    .select({ session: userSessions, user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(
      and(
        eq(userSessions.tokenHash, hashToken(token)),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return null;
  await db
    .update(userSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(userSessions.id, row.session.id));
  return toAuthUser(row.user);
}

export async function revokeSession(token: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.tokenHash, hashToken(token)));
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
}

export async function requestPasswordReset(email: string): Promise<void> {
  // Always succeed from the caller's perspective (no enumeration).
  const user = await findUserByEmail(email);
  if (!user) return;
  const token = newToken();
  await db.insert(userTokens).values({
    userId: user.id,
    purpose: "password_reset",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });
  await enqueueEmail({
    eventKey: `password-reset:${user.id}:${hashToken(token).slice(0, 16)}`,
    recipient: user.email,
    templateKey: "password-reset",
    payload: { resetUrl: appUrl(`/auth/reset-password?token=${token}`) },
  });
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<AuthUser> {
  const [row] = await db
    .select({ token: userTokens, user: users })
    .from(userTokens)
    .innerJoin(users, eq(userTokens.userId, users.id))
    .where(
      and(
        eq(userTokens.purpose, "password_reset"),
        eq(userTokens.tokenHash, hashToken(token)),
        isNull(userTokens.consumedAt),
      ),
    )
    .limit(1);
  if (!row) throw new AuthServiceError("invalid_token", "The reset link is invalid.");
  if (row.token.expiresAt.getTime() < Date.now()) {
    throw new AuthServiceError("expired_token", "The reset link has expired.");
  }
  await db.transaction(async (tx) => {
    await tx
      .update(userTokens)
      .set({ consumedAt: new Date() })
      .where(eq(userTokens.id, row.token.id));
    await tx
      .update(users)
      .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
      .where(eq(users.id, row.user.id));
    await tx
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(userSessions.userId, row.user.id), isNull(userSessions.revokedAt)));
  });
  const [updated] = await db.select().from(users).where(eq(users.id, row.user.id)).limit(1);
  return toAuthUser(updated);
}
