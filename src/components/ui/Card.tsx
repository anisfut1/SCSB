import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type CardVariant = "default" | "interactive" | "glow" | "muted";

/**
 * Carte signature (design-system/scsb/MASTER.md §6) : ombre diffuse → filet
 * hairline → highlight interne → surface → contenu → overlay/micro-glow accent.
 * `interactive` = survol/pression premium ; `glow` = état mis en avant permanent.
 */
export function Card({ variant = "default", padded = true, className, children, ...props }: { variant?: CardVariant; padded?: boolean } & ComponentProps<"div">) {
  if (variant === "muted") {
    return (
      <div className={cn("surface-panel", padded && "p-4 sm:p-5", className)} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div
      data-interactive={variant === "interactive" || undefined}
      data-glow={variant === "glow" || undefined}
      className={cn("surface-card", padded && "p-4 sm:p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** En-tête de carte : icône en médaillon optionnelle, titre, description, actions à droite. */
export function CardHeader({
  icon,
  title,
  description,
  actions,
  className,
  as: Heading = "h2",
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {icon ? <IconMedallion>{icon}</IconMedallion> : null}
      <div className="text-reflow flex-1">
        <Heading className="type-card text-foreground">{title}</Heading>
        {description ? <p className="type-meta mt-0.5">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Médaillon d'icône : petite surface en relief, icône accent. */
export function IconMedallion({ children, tone = "accent", size = "md", className }: { children: ReactNode; tone?: "accent" | "neutral" | "success" | "warning" | "danger" | "info"; size?: "sm" | "md" | "lg"; className?: string }) {
  const tones = {
    accent: "text-accent-text bg-accent-soft border-accent-border",
    neutral: "text-muted bg-surface border-border",
    success: "text-success bg-success-soft border-[color-mix(in_oklab,var(--success)_22%,transparent)]",
    warning: "text-warning bg-warning-soft border-[color-mix(in_oklab,var(--warning)_24%,transparent)]",
    danger: "text-danger bg-danger-soft border-[color-mix(in_oklab,var(--danger)_22%,transparent)]",
    info: "text-info bg-info-soft border-[color-mix(in_oklab,var(--info)_22%,transparent)]",
  } as const;
  const sizes = { sm: "size-8 rounded-[10px] [&_svg]:size-4", md: "size-10 rounded-md [&_svg]:size-[18px]", lg: "size-12 rounded-[14px] [&_svg]:size-5" } as const;
  return (
    <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center border shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]", tones[tone], sizes[size], className)}>
      {children}
    </span>
  );
}

/** Séparateur interne de carte. */
export function CardDivider({ className }: { className?: string }) {
  return <hr className={cn("my-4 border-0 border-t border-border", className)} />;
}
