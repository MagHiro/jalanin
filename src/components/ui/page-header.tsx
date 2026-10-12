import type { ReactNode } from "react";

/**
 * Consistent page heading block: icon tile + eyebrow + title + optional
 * description and trailing actions (incident.io-informed header grammar).
 * One reading order across public, student, admin.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-lg text-primary"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {description && (
            <div className="mt-1.5 text-sm leading-6 text-muted-foreground md:text-[15px]">
              {description}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
