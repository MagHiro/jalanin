import { cn } from "./cn";

/**
 * Skeleton loading surfaces for `loading.tsx` fallbacks and
 * Suspense boundaries. Reduced-motion safe (CSS shimmer disabled).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton h-4 w-full", className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("surface-card space-y-3 p-5", className)}>
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="skeleton h-9 w-28 !rounded-lg" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div aria-hidden="true" className="table-shell p-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 border-b border-border p-3 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
