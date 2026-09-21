import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

/**
 * Carte générique minimale. Volontairement sans variante ni dépendance UI :
 * à faire évoluer quand un vrai besoin de design system apparaîtra.
 */
export function Card({ title, description, children }: CardProps) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <h3 className="text-sm font-semibold text-black/90 dark:text-white/90">{title}</h3>
      {description ? <p className="mt-1 text-sm text-black/60 dark:text-white/60">{description}</p> : null}
      {children}
    </div>
  );
}
