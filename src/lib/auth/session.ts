import { cookies } from "next/headers";

export const SESSION_COOKIE = "jalanin_session";

/** HttpOnly session cookie. Secure in production; Lax + strict-path. */
export function setSessionCookie(token: string, expiresAt: Date): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function readSessionCookie(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}
