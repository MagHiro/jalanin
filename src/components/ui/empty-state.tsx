import Link from "next/link";
import type { ReactNode } from "react";
import { DomainIcon } from "./domain-icon";

/**
 * Designed empty state: calm dashed surface, explanatory copy,
 * and one clear next action. Never implies a confirmed record.
 */
export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
  icon,
}: {
  title: string;
  body?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center md:p-10">
      {icon && (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-xl text-primary"
        >
          {typeof icon === "string" ? <DomainIcon name={icon} size={24} /> : icon}
        </div>
      )}
      <p className="text-base font-semibold tracking-tight text-foreground">
        {title}
      </p>
      {body && (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {body}
        </p>
      )}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-primary btn-sm mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
