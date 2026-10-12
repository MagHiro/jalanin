import Link from "next/link";

/**
 * ActiveFilterChips — visible query shape (incident.io toolbar-inspired, price-free).
 * Each chip links to the same listing with that filter removed.
 */
export function ActiveFilterChips({
  chips,
}: {
  chips: Array<{ label: string; href: string }>;
}) {
  if (chips.length === 0) return null;
  return (
    <div
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          aria-label={`Remove filter ${c.label}`}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-jalanin-200 bg-jalanin-100 px-3 py-1 text-xs font-semibold text-jalanin-800 transition hover:bg-jalanin-200"
        >
          {c.label}
          <span aria-hidden="true">✕</span>
        </Link>
      ))}
    </div>
  );
}
