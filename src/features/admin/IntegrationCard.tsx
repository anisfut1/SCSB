import type { ReactNode } from "react";
import { StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { IconMedallion } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";

/**
 * Carte d'intégration (FFBB / FBI / e-Marque) : identité, statut réel
 * (icône + libellé, jamais la couleur seule), métadonnées et actions.
 */
export function IntegrationCard({
  icon,
  name,
  role,
  status,
  children,
  footer,
  highlight,
  className,
}: {
  icon: ReactNode;
  name: string;
  role: string;
  status: { label: string; tone: BadgeTone; icon?: ReactNode };
  children?: ReactNode;
  footer?: ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <article data-glow={highlight || undefined} className={cn("surface-card flex flex-col", className)}>
      <div className="flex items-start gap-3.5 p-5">
        <IconMedallion size="lg" tone={status.tone === "danger" ? "danger" : status.tone === "success" ? "accent" : "neutral"}>
          {icon}
        </IconMedallion>
        <div className="text-reflow flex-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{name}</h2>
          <p className="type-meta mt-0.5">{role}</p>
        </div>
        <StatusBadge tone={status.tone} icon={status.icon}>
          {status.label}
        </StatusBadge>
      </div>
      {children ? <div className="flex-1 border-t border-border px-5 py-4">{children}</div> : <div className="flex-1" />}
      {footer ? <div className="flex flex-col gap-3 border-t border-border bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] px-5 py-4">{footer}</div> : null}
    </article>
  );
}
