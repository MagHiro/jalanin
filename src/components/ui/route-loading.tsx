import { CardSkeleton, Skeleton, TableSkeleton } from "./skeleton";

export function RouteLoading({ table = false }: { table?: boolean }) {
  return (
    <div role="status" aria-label="Loading page" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-9 max-w-xs" />
      <Skeleton className="h-4 max-w-md" />
      {table ? <TableSkeleton /> : <><CardSkeleton /><CardSkeleton /></>}
    </div>
  );
}
