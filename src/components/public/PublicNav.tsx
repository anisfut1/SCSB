"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, CalendarDays, ClipboardList, Lock, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { usePublicIdentity, type PublicIdentityState } from "@/features/public/PublicIdentityProvider";

interface PublicNavItem {
  segment: "resultats" | "matchs" | "tables" | "derogations";
  label: string;
  icon: LucideIcon;
}

/**
 * Onglets de l'espace public (retour du club, 2026-10-01 : "la personne
 * doit avoir accès aussi à la tab bar en bas"). Toujours les mêmes
 * destinations : un onglet qui exige un lien personnel (Tables,
 * Dérogations) ne disparaît jamais, il demande à s'identifier une fois
 * ouvert. Le cadenas sur Dérogations signale seulement l'accès réservé.
 */
const ITEMS: PublicNavItem[] = [
  // Retour du club, 2026-10-01 : « à gauche de matchs dans la barre, un nouveau truc "derniers résultats" ».
  { segment: "resultats", label: "Résultats", icon: Trophy },
  { segment: "matchs", label: "Matchs", icon: CalendarDays },
  { segment: "tables", label: "Tables", icon: ClipboardList },
  { segment: "derogations", label: "Dérogations", icon: CalendarClock },
];

function useActiveSegment(clubSlug: string): string | null {
  const pathname = usePathname();
  const prefix = `/public/${clubSlug}/`;
  if (!pathname.startsWith(prefix)) return null;
  return pathname.slice(prefix.length).split("/")[0] ?? null;
}

/** Cadenas sur Dérogations tant que l'identité n'y donne aucun accès (admin, coach ou coordinateur). */
function showsLock(segment: PublicNavItem["segment"], identity: PublicIdentityState): boolean {
  if (segment !== "derogations") return false;
  return !(identity && (identity.isClubAdmin || identity.derogationRequests.canCreate || identity.derogationRequests.canManage));
}

/** Onglets horizontaux dans l'en-tête, ≥ lg. */
export function PublicTopTabs({ clubSlug }: { clubSlug: string }) {
  const active = useActiveSegment(clubSlug);
  const { identity } = usePublicIdentity();
  return (
    <nav aria-label="Espace public" className="hidden h-full items-stretch gap-1 lg:flex">
      {ITEMS.map((item) => {
        const isActive = active === item.segment;
        const Icon = item.icon;
        return (
          <Link
            key={item.segment}
            href={`/public/${clubSlug}/${item.segment}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center gap-2 px-3 text-sm font-medium transition-colors duration-150",
              isActive ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden className={cn("size-[17px]", isActive ? "text-accent-text" : "")} />
            {item.label}
            {showsLock(item.segment, identity) ? <Lock aria-label="Accès réservé" className="size-3 text-subtle" /> : null}
            <span aria-hidden className={cn("absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent transition-opacity duration-150", isActive ? "opacity-100" : "opacity-0")} />
          </Link>
        );
      })}
    </nav>
  );
}

/** Barre du bas, < lg — même gabarit que la barre de l'espace connecté (MobileChrome). */
export function PublicBottomNav({ clubSlug }: { clubSlug: string }) {
  const active = useActiveSegment(clubSlug);
  const { identity } = usePublicIdentity();
  return (
    <nav aria-label="Espace public" className="surface-glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden">
      <ul className="mx-auto flex h-[var(--bottom-nav-height)] max-w-xl items-stretch px-2">
        {ITEMS.map((item) => {
          const isActive = active === item.segment;
          const Icon = item.icon;
          return (
            <li key={item.segment} className="flex-1">
              <Link
                href={`/public/${clubSlug}/${item.segment}`}
                aria-current={isActive ? "page" : undefined}
                className={cn("group flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150", isActive ? "text-foreground" : "text-muted")}
              >
                <span
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-150",
                    isActive ? "bg-accent-soft shadow-glow-xs" : "group-active:bg-surface-muted",
                  )}
                >
                  <Icon aria-hidden className={cn("size-[19px]", isActive ? "text-accent-text" : "")} />
                  {showsLock(item.segment, identity) ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex size-4 items-center justify-center rounded-full border border-border bg-surface-raised">
                      <Lock aria-label="Accès réservé" className="size-2.5 text-subtle" />
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
