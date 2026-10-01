"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Check, LayoutGrid, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { ClubLogo } from "@/components/ui/Logo";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/components/ui/cn";
import { signOutAction } from "@/server/actions/auth";
import { NAV_ICONS } from "./icons";
import { isActive, type NavItem, type NavSection } from "./nav";
import { NavSections } from "./Sidebar";
import { UserAvatar } from "./UserMenu";
import type { ShellUser, ShellWorkspace } from "./types";

/**
 * Chrome mobile/tablette (< lg) : topbar compacte + barre du bas native
 * (4 destinations + Menu) + feuille « Menu » avec toute la navigation,
 * les clubs et le compte. Cibles ≥ 44 px, safe-area iOS respectée.
 */
export function MobileChrome({
  sections,
  primary,
  current,
  workspaces,
  user,
  isPlatformAdmin,
  platformLabel,
  variant,
}: {
  sections: NavSection[];
  primary: NavItem[];
  current: ShellWorkspace | null;
  workspaces: ShellWorkspace[];
  user: ShellUser;
  isPlatformAdmin: boolean;
  platformLabel: string;
  variant: "club" | "platform";
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = useCallback(() => setMenuOpen(false), []);
  const primaryActive = primary.some((item) => isActive(pathname, item));

  return (
    <>
      <header className="surface-glass sticky top-0 z-30 border-b border-border lg:hidden">
        <div className="flex h-[var(--topbar-height)] items-center gap-3 px-4 sm:px-6">
          {current ? <ClubLogo name={current.name} src={current.logoUrl} size="sm" /> : <BrandMark />}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{current?.name ?? platformLabel}</p>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu du compte"
            className="-mr-1.5 inline-flex size-11 items-center justify-center rounded-full"
          >
            <UserAvatar name={user.displayName} />
          </button>
        </div>
      </header>

      <nav aria-label="Navigation principale" className="surface-glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden">
        <ul className="mx-auto flex h-[var(--bottom-nav-height)] max-w-xl items-stretch px-2">
          {primary.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = isActive(pathname, item);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("group flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150", active ? "text-foreground" : "text-muted")}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-150",
                      active ? "bg-accent-soft shadow-glow-xs" : "group-active:bg-surface-muted",
                    )}
                  >
                    <Icon aria-hidden className={cn("size-[19px]", active ? "text-accent-text" : "")} />
                  </span>
                  <span className="max-w-full truncate px-1">{shortLabel(item.label)}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              className={cn("group flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150", !primaryActive || menuOpen ? "text-foreground" : "text-muted")}
            >
              <span className={cn("inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", !primaryActive ? "bg-accent-soft shadow-glow-xs" : "group-active:bg-surface-muted")}>
                <Menu aria-hidden className={cn("size-[19px]", !primaryActive ? "text-accent-text" : "")} />
              </span>
              Menu
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={menuOpen} onClose={close} title="Menu" side="bottom">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-[14px] border border-border bg-surface-raised p-3 shadow-1">
            <UserAvatar name={user.displayName} className="size-10 text-[13px]" />
            <div className="text-reflow flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.displayName}</p>
              {user.email && user.email !== user.displayName ? <p className="truncate text-xs text-muted">{user.email}</p> : null}
            </div>
          </div>

          <nav aria-label="Toutes les sections" className="flex flex-col pl-3">
            <NavSections sections={sections} onNavigate={close} />
          </nav>

          {workspaces.length > 1 || variant === "platform" ? (
            <div className="flex flex-col gap-0.5 pl-3">
              <p className="type-eyebrow px-3 pb-2 pt-5">Vos clubs</p>
              {workspaces.map((ws) => (
                <Link key={ws.slug} href={`/c/${ws.slug}/dashboard`} onClick={close} className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm text-foreground hover:bg-surface-muted">
                  <ClubLogo name={ws.name} src={ws.logoUrl} size="xs" />
                  <span className="flex-1 truncate">{ws.name}</span>
                  {ws.slug === current?.slug ? <Check aria-hidden className="size-4 text-accent-text" /> : null}
                </Link>
              ))}
              {workspaces.length > 1 ? (
                <Link href="/" onClick={close} className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm text-muted hover:bg-surface-muted hover:text-foreground">
                  <LayoutGrid aria-hidden className="size-[18px]" />
                  Tous mes clubs
                </Link>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
            {isPlatformAdmin && variant !== "platform" ? (
              <Link href="/platform/clubs" onClick={close} className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm text-foreground hover:bg-surface-muted">
                <ShieldCheck aria-hidden className="size-[18px] text-muted" />
                Administration plateforme
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm text-danger hover:bg-danger-soft">
                <LogOut aria-hidden className="size-[18px]" />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </Sheet>
    </>
  );
}

/** Libellés courts pour la barre du bas (≤ 10 caractères visibles). */
function shortLabel(label: string): string {
  if (label === "Tables de marque") return "Tables";
  return label;
}
