import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "./cn";
import { IconMedallion } from "./Card";

/**
 * KPI : valeur en chiffres de données, libellé, contexte. N'affiche que des
 * valeurs réelles — `value` null ⇒ tiret « — » + `emptyHint`.
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
  href,
  tone = "accent",
  emptyHint,
  className,
}: {
  label: string;
  value: ReactNode | null;
  icon?: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "accent" | "neutral" | "success" | "warning" | "danger" | "info";
  emptyHint?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="type-eyebrow pt-1">{label}</p>
        {icon ? (
          <IconMedallion size="sm" tone={tone}>
            {icon}
          </IconMedallion>
        ) : null}
      </div>
      <p className="type-numeric mt-3 text-[2rem] font-medium leading-none text-foreground">{value ?? "—"}</p>
      {value === null && emptyHint ? <p className="type-meta mt-2">{emptyHint}</p> : hint ? <div className="type-meta mt-2">{hint}</div> : null}
      {href ? <ArrowUpRight aria-hidden className="absolute bottom-4 right-4 size-4 text-subtle transition-colors duration-150 group-hover:text-accent-text" /> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} data-interactive="true" className={cn("surface-card group flex flex-col p-4 sm:p-5", className)}>
        {body}
      </Link>
    );
  }
  return <div className={cn("surface-card flex flex-col p-4 sm:p-5", className)}>{body}</div>;
}
