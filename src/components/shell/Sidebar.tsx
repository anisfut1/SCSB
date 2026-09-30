"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { NAV_ICONS } from "./icons";
import { isActive, type NavItem, type NavSection } from "./nav";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import type { ShellUser, ShellWorkspace } from "./types";

export function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm transition-[background-color,color,box-shadow] duration-150",
        active
          ? "bg-surface-raised font-medium text-foreground shadow-[var(--shadow-inset-highlight),var(--shadow-1),0_0_0_1px_var(--border)]"
          : "text-muted hover:bg-[color-mix(in_oklab,var(--surface-muted)_70%,transparent)] hover:text-foreground",
      )}
    >
      {/* rail accent + micro-glow : l'état actif ne repose pas sur la couleur seule (relief + graisse) */}
      <span
        aria-hidden
        className={cn(
          "absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_10px_var(--club-accent-glow)] transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <Icon aria-hidden className={cn("size-[18px] shrink-0 transition-colors duration-150", active ? "text-accent-text" : "text-subtle group-hover:text-muted")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function NavSections({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {sections.map((section, index) => (
        <div key={section.label ?? index} className="flex flex-col gap-0.5">
          {section.label ? <p className="type-eyebrow px-3 pb-2 pt-5">{section.label}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function Sidebar({
  sections,
  current,
  workspaces,
  user,
  isPlatformAdmin,
  platformLabel,
  variant,
}: {
  sections: NavSection[];
  current: ShellWorkspace | null;
  workspaces: ShellWorkspace[];
  user: ShellUser;
  isPlatformAdmin: boolean;
  platformLabel: string;
  variant: "club" | "platform";
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col border-r border-border bg-[color-mix(in_oklab,var(--surface)_70%,var(--background))] lg:flex">
      <div className="px-3 pb-2 pt-3">
        <WorkspaceSwitcher current={current} workspaces={workspaces} platformLabel={platformLabel} />
      </div>
      <nav aria-label="Navigation principale" className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {variant === "platform" && workspaces.length > 0 ? (
          <Link href="/" className="mb-2 flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-sm text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground">
            <ArrowLeft aria-hidden className="size-[18px] text-subtle" />
            Retour à mes clubs
          </Link>
        ) : null}
        <NavSections sections={sections} />
      </nav>
      <div className="border-t border-border p-3">
        <UserMenu user={user} isPlatformAdmin={isPlatformAdmin} platformActive={variant === "platform"} />
      </div>
    </aside>
  );
}
