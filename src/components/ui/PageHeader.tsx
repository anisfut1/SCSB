import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "./cn";

/**
 * En-tête de page éditorial : eyebrow (contexte), titre serif, description,
 * actions alignées à droite sur desktop et empilées sous le titre en mobile.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
  meta,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 [animation:rise-in_var(--duration-slow)_var(--ease-out)]", className)}>
      {back ? <BackButton href={back.href} label={back.label} /> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="text-reflow flex flex-col gap-2">
          {eyebrow ? <p className="type-eyebrow">{eyebrow}</p> : null}
          <h1 className="type-title text-foreground">{title}</h1>
          {description ? <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p> : null}
          {meta ? <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Titre de section (h2) avec description et action optionnelles. */
export function SectionHeader({
  title,
  description,
  action,
  icon,
  className,
  as: Heading = "h2",
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="text-reflow">
        <Heading id={id} className="type-section flex items-center gap-2 text-foreground">
          {icon ? <span aria-hidden className="inline-flex text-accent-text [&_svg]:size-4">{icon}</span> : null}
          {title}
        </Heading>
        {description ? <p className="type-meta mt-0.5">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * Bouton retour : lien explicite vers le parent (pas `history.back()`, pour
 * rester fiable après un lien partagé). Cible tactile 44 px.
 */
export function BackButton({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group -ml-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-2 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-foreground sm:min-h-9",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-surface-raised shadow-1 transition-transform duration-150 group-hover:-translate-x-0.5"
      >
        <ArrowLeft className="size-3.5" />
      </span>
      {label}
    </Link>
  );
}

/** Conteneur de page : largeur contrôlée, gouttières responsive. */
export function PageContainer({ width = "default", className, children }: { width?: "wide" | "default" | "narrow"; className?: string; children: ReactNode }) {
  const widths = { wide: "max-w-[var(--content-wide)]", default: "max-w-[var(--content-default)]", narrow: "max-w-[var(--content-narrow)]" } as const;
  return <div className={cn("mx-auto flex w-full flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", widths[width], className)}>{children}</div>;
}
