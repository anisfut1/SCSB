import type { ReactNode } from "react";
import { clubAccentStyle } from "@/lib/ui/accent";
import { PLATFORM_NAME } from "@/config/site";
import { MobileChrome } from "./MobileChrome";
import { buildMobilePrimary, type NavSection } from "./nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { ShellUser, ShellWorkspace } from "./types";

/**
 * Shell applicatif (design-system/scsb/MASTER.md §10) : sidebar fixe ≥ lg,
 * topbar + barre du bas en dessous. L'accent du club est injecté ici une
 * seule fois (`--club-accent*`) et hérité par tout le sous-arbre, y compris
 * les feuilles/modales (rendues dans le même arbre, pas en portail).
 */
export function AppShell({
  variant,
  sections,
  current,
  workspaces,
  user,
  isPlatformAdmin,
  accentColor,
  publicHref,
  children,
}: {
  variant: "club" | "platform";
  sections: NavSection[];
  current: ShellWorkspace | null;
  workspaces: ShellWorkspace[];
  user: ShellUser;
  isPlatformAdmin: boolean;
  accentColor?: string | null;
  publicHref?: string;
  children: ReactNode;
}) {
  const primary = buildMobilePrimary(sections);
  return (
    <div style={clubAccentStyle(accentColor)} className="flex min-h-full flex-1 flex-col">
      <a
        href="#main"
        className="sr-only z-[80] rounded-md bg-surface-raised px-4 py-2 text-sm font-medium shadow-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <Sidebar sections={sections} current={current} workspaces={workspaces} user={user} isPlatformAdmin={isPlatformAdmin} platformLabel={PLATFORM_NAME} variant={variant} />
      <div className="flex min-h-full flex-1 flex-col lg:pl-[var(--sidebar-width)]">
        <MobileChrome
          sections={sections}
          primary={primary}
          current={current}
          workspaces={workspaces}
          user={user}
          isPlatformAdmin={isPlatformAdmin}
          platformLabel={PLATFORM_NAME}
          variant={variant}
        />
        <Topbar sections={sections} workspaceLabel={current?.name ?? PLATFORM_NAME} publicHref={publicHref} />
        <main id="main" tabIndex={-1} className="pb-safe-nav flex flex-1 flex-col outline-none lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
