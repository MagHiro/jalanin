import { cn, statusBadgeClass } from "./cn";

/**
 * Accessible status badge: dot + text, never color-only.
 * Wraps the semantic `statusBadgeClass` color mapping with a visible dot
 * so status is communicated by shape and label, not hue alone.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span className={cn("badge", statusBadgeClass(status), className)}>
      <span aria-hidden="true" className="badge-dot" />
      {status}
    </span>
  );
}
