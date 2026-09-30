import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  success: { box: "bg-success-soft text-success border-[color-mix(in_oklab,var(--success)_20%,transparent)]", dot: "bg-success" },
  warning: { box: "bg-warning-soft text-warning border-[color-mix(in_oklab,var(--warning)_22%,transparent)]", dot: "bg-warning" },
  danger: { box: "bg-danger-soft text-danger border-[color-mix(in_oklab,var(--danger)_20%,transparent)]", dot: "bg-danger" },
  info: { box: "bg-info-soft text-info border-[color-mix(in_oklab,var(--info)_20%,transparent)]", dot: "bg-info" },
  neutral: { box: "bg-surface-muted text-muted border-border", dot: "bg-subtle" },
  accent: { box: "bg-accent-soft text-accent-text border-accent-border", dot: "bg-accent" },
};

/**
 * Badge de statut : la couleur n'est jamais seule porteuse de sens — un
 * libellé est toujours présent, et un point ou une icône le renforce.
 */
export function StatusBadge({
  tone = "neutral",
  icon,
  dot = !icon,
  children,
  size = "md",
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  dot?: boolean;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border font-medium leading-none [&_svg]:size-3.5 [&_svg]:shrink-0",
        size === "sm" ? "h-6 px-2 text-[11.5px]" : "h-7 px-2.5 text-xs",
        t.box,
        className,
      )}
    >
      {icon ? <span aria-hidden className="inline-flex">{icon}</span> : dot ? <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", t.dot)} /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
