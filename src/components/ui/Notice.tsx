import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "./cn";

type NoticeTone = "info" | "success" | "warning" | "danger" | "neutral";

const tones: Record<NoticeTone, { box: string; icon: ReactNode; iconColor: string }> = {
  info: { box: "bg-info-soft border-[color-mix(in_oklab,var(--info)_20%,transparent)]", icon: <Info />, iconColor: "text-info" },
  success: { box: "bg-success-soft border-[color-mix(in_oklab,var(--success)_20%,transparent)]", icon: <CheckCircle2 />, iconColor: "text-success" },
  warning: { box: "bg-warning-soft border-[color-mix(in_oklab,var(--warning)_24%,transparent)]", icon: <AlertTriangle />, iconColor: "text-warning" },
  danger: { box: "bg-danger-soft border-[color-mix(in_oklab,var(--danger)_20%,transparent)]", icon: <OctagonAlert />, iconColor: "text-danger" },
  neutral: { box: "bg-surface border-border", icon: <Info />, iconColor: "text-muted" },
};

/** Bandeau contextuel (information, avertissement…) — icône + texte, jamais la couleur seule. */
export function Notice({
  tone = "info",
  title,
  children,
  action,
  icon,
  className,
  live,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  live?: boolean;
}) {
  const t = tones[tone];
  return (
    <div
      role={live ? (tone === "danger" ? "alert" : "status") : undefined}
      className={cn("flex flex-col gap-3 rounded-[var(--radius-md)] border px-4 py-3 sm:flex-row sm:items-start", t.box, className)}
    >
      <span aria-hidden className={cn("mt-0.5 inline-flex shrink-0 [&_svg]:size-[18px]", t.iconColor)}>
        {icon ?? t.icon}
      </span>
      <div className="text-reflow flex-1 text-sm leading-relaxed text-foreground">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title ? "mt-0.5" : "", "text-[13.5px] text-muted [&_strong]:text-foreground")}>{children}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2 sm:self-center">{action}</div> : null}
    </div>
  );
}
