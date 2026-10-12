/**
 * StatusTimeline — accurate workflow timeline.
 * Renders committed status events chronologically with timestamps;
 * drafts show a single "awaiting submission" state. Never invents
 * percentages or expiry.
 */
export function StatusTimeline({
  events,
  emptyLabel = "Submitted — awaiting review.",
}: {
  events: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    reason?: string | null;
    createdAt: string | Date;
  }>;
  emptyLabel?: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ol className="relative space-y-0 border-l-2 border-border pl-0">
      {events.map((e, i) => (
        <li
          key={e.id}
          className="relative pb-5 pl-7 last:pb-0"
        >
          <span
            aria-hidden="true"
            className={`absolute -left-[7px] top-1 size-3 rounded-full border-2 ${
              i === events.length - 1
                ? "border-primary bg-primary"
                : "border-border bg-surface"
            }`}
          />
          <p className="text-sm text-foreground">
            {e.fromStatus ? (
              <span className="text-muted-foreground">{e.fromStatus} → </span>
            ) : null}
            <strong className="font-semibold">{e.toStatus}</strong>
            {e.reason ? (
              <span className="text-muted-foreground"> — {e.reason}</span>
            ) : null}
          </p>
          <p className="tnum mt-0.5 text-xs text-muted-foreground">
            <time>
              {new Date(e.createdAt).toLocaleString("en-SG")}
            </time>
          </p>
        </li>
      ))}
    </ol>
  );
}
