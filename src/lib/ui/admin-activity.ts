/**
 * Presentation-only audit copy. Preserve source records and state-machine values;
 * translate the persisted action token into language suitable for an activity feed.
 */
export function describeAdminActivity(entityType: string, action: string) {
  const entity = ({
    application: "Application",
    internship: "Internship",
    placement: "Placement",
    student: "Student",
  } as Record<string, string>)[entityType] ?? "Record";

  const transition = /^status:(.+)->(.+)$/.exec(action);
  if (transition) return {
    title: `${entity} moved to ${transition[2].trim()}`,
    detail: `${transition[1].trim()} → ${transition[2].trim()}`,
    tone: "transition" as const,
  };

  const actions: Record<string, { title: string; detail: string; tone: "submitted" | "updated" | "created" }> = {
    submitted: { title: "Application submitted", detail: "New student submission", tone: "submitted" },
    "student-revision": { title: "Application revised", detail: "Student submitted changes", tone: "updated" },
    "revision-acknowledged": { title: "Revision reviewed", detail: "Updated application acknowledged", tone: "updated" },
    reopened: { title: "Application reopened", detail: "Returned to review", tone: "updated" },
    created: { title: `${entity} created`, detail: "New record added", tone: "created" },
    updated: { title: `${entity} updated`, detail: "Record details changed", tone: "updated" },
  };
  const known = actions[action];
  if (known) return known;
  const readable = action.replace(/[-_]/g, " ").trim();
  return { title: `${entity} activity`, detail: readable || "Change recorded", tone: "updated" as const };
}

/** Audit entity IDs are text in the database; link only well-formed UUIDs. */
export function adminActivityHref(entityType: string, entityId: string): string | null {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId)) return null;
  if (entityType === "application") return `/admin/applications/${entityId}`;
  if (entityType === "internship") return `/admin/internships/${entityId}/edit`;
  if (entityType === "placement") return `/admin/placements/${entityId}/edit`;
  if (entityType === "student") return `/admin/students/${entityId}`;
  return null;
}
