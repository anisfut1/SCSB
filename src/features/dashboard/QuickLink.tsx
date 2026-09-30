import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { IconMedallion } from "@/components/ui/Card";

/** Raccourci de navigation en carte interactive (icône en médaillon, flèche). */
export function QuickLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} data-interactive="true" className="surface-card group flex items-center gap-3.5 p-3.5">
      <IconMedallion>{icon}</IconMedallion>
      <span className="text-reflow flex flex-1 flex-col">
        <span className="type-card text-foreground">{title}</span>
        <span className="type-meta line-clamp-2">{description}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent-text" />
    </Link>
  );
}
