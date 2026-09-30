import { cn } from "./cn";

/** Bloc de chargement neutre (shimmer désactivé en reduced-motion). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

/** Squelette de page générique : en-tête + grille de cartes. */
export function PageSkeleton({ cards = 4, label = "Chargement" }: { cards?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex w-full max-w-[var(--content-default)] flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <span className="sr-only">{label}…</span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="surface-card flex flex-col gap-3 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Squelette de liste (lignes). */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden className="surface-card divide-y divide-border">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
