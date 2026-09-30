import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "./cn";

/**
 * État vide : explique pourquoi c'est vide et, si possible, quoi faire.
 * Jamais de donnée inventée pour « remplir ».
 */
export function EmptyState({
  icon = <Inbox />,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-panel relative flex flex-col items-center overflow-hidden text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-10 sm:py-14",
        className,
      )}
    >
      <div aria-hidden className="court-pattern pointer-events-none absolute inset-0 opacity-60" />
      <span
        aria-hidden
        className={cn(
          "relative inline-flex items-center justify-center rounded-[14px] border border-border bg-surface-raised text-muted shadow-[var(--shadow-inset-highlight),var(--shadow-1)]",
          compact ? "size-10 [&_svg]:size-[18px]" : "size-12 [&_svg]:size-5",
        )}
      >
        {icon}
      </span>
      <div className="relative flex max-w-sm flex-col gap-1">
        <p className="type-card text-foreground">{title}</p>
        {description ? <p className="type-meta text-reflow">{description}</p> : null}
      </div>
      {action ? <div className="relative mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/** État d'erreur : message clair + action de reprise. `role=alert`. */
export function ErrorState({
  title = "Une erreur est survenue",
  description,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("surface-panel flex flex-col items-center gap-3 border-[color-mix(in_oklab,var(--danger)_18%,transparent)] px-6 py-10 text-center", className)}>
      <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-[14px] border border-[color-mix(in_oklab,var(--danger)_22%,transparent)] bg-danger-soft text-danger [&_svg]:size-5">
        <AlertTriangle />
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="type-card text-foreground">{title}</p>
        {description ? <p className="type-meta text-reflow">{description}</p> : null}
      </div>
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
