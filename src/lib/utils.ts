import { db } from "@/lib/db/client";
import { auditEvents } from "@/lib/db/schema";

/** Append a sanitized audit event. Never pass secrets, tokens, or file bytes. */
export async function audit(input: {
  actorUserId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown>;
}): Promise<void> {
  await db.insert(auditEvents).values({
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    changes: (input.changes ?? {}) as Record<string, unknown>,
  });
}

/** Extract a COUNT(*) aggregate regardless of driver row shape. */
export function singleCount(rows: Array<{ n: unknown }>): number {
  return Number(rows[0]?.n ?? 0);
}
/** Short stable reference shown to students and in emails (UAT-friendly). */
export function applicationRef(id: string): string {
  return `JL-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
