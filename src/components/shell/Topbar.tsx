"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Globe } from "lucide-react";
import { isActive, type NavSection } from "./nav";

/**
 * Topbar desktop légère : fil d'Ariane (espace › section) et raccourci vers
 * la page publique du club quand elle existe. Aucun contenu inventé.
 */
export function Topbar({ sections, workspaceLabel, publicHref }: { sections: NavSection[]; workspaceLabel: string; publicHref?: string }) {
  const pathname = usePathname();
  let crumbSection: string | undefined;
  let crumbItem: { href: string; label: string } | undefined;
  for (const section of sections) {
    const item = section.items.find((candidate) => isActive(pathname, candidate));
    if (item) {
      crumbSection = section.label;
      crumbItem = item;
      break;
    }
  }

  return (
    <header className="surface-glass sticky top-0 z-20 hidden h-[var(--topbar-height)] items-center border-b border-border lg:flex">
      <div className="flex w-full items-center justify-between gap-4 px-10">
        <nav aria-label="Fil d'Ariane" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px] text-muted">
            <li className="truncate">{workspaceLabel}</li>
            {crumbSection ? (
              <>
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-subtle" />
                <li className="truncate">{crumbSection}</li>
              </>
            ) : null}
            {crumbItem ? (
              <>
                <ChevronRight aria-hidden className="size-3.5 shrink-0 text-subtle" />
                <li className="truncate">
                  {pathname === crumbItem.href ? (
                    <span aria-current="page" className="font-medium text-foreground">
                      {crumbItem.label}
                    </span>
                  ) : (
                    <Link href={crumbItem.href} className="transition-colors duration-150 hover:text-foreground">
                      {crumbItem.label}
                    </Link>
                  )}
                </li>
              </>
            ) : null}
          </ol>
        </nav>
        {publicHref ? (
          <Link href={publicHref} className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground">
            <Globe aria-hidden className="size-4" />
            Page publique
          </Link>
        ) : null}
      </div>
    </header>
  );
}
