import type { ReactNode } from "react";
import { ClubLogo } from "@/components/ui/Logo";
import { BrandMark } from "@/components/brand/BrandMark";
import { PLATFORM_NAME } from "@/config/site";
import { cn } from "@/components/ui/cn";

/**
 * Cadre des pages publiques sans compte (/public/{slug}/...) : identité du
 * club en tête, aucune navigation applicative ni action d'administration.
 */
export function PublicFrame({ club, children, width = "wide" }: { club?: { name: string; logoUrl: string | null } | null; children: ReactNode; width?: "wide" | "default" | "narrow" }) {
  const widths = { wide: "max-w-[var(--content-wide)]", default: "max-w-[var(--content-default)]", narrow: "max-w-[var(--content-narrow)]" } as const;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="surface-glass sticky top-0 z-30 border-b border-border">
        <div className={cn("mx-auto flex h-[var(--topbar-height)] w-full items-center gap-3 px-4 sm:px-6 lg:px-10", widths[width])}>
          {club ? <ClubLogo name={club.name} src={club.logoUrl} size="sm" /> : <BrandMark />}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{club?.name ?? PLATFORM_NAME}</p>
          <span className="type-eyebrow hidden sm:inline">Espace public</span>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">{children}</main>
      <footer className="pb-safe border-t border-border">
        <div className={cn("mx-auto flex w-full items-center gap-2 px-4 py-5 text-xs text-muted sm:px-6 lg:px-10", widths[width])}>
          <BrandMark className="size-5 rounded-[6px]" />
          {PLATFORM_NAME}
        </div>
      </footer>
    </div>
  );
}
