"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import { signOutAction } from "@/server/actions/auth";
import { monogram } from "@/lib/ui/accent";
import { Popover, menuItemClass } from "@/components/ui/Popover";
import type { ShellUser } from "./types";

export function UserAvatar({ name, className = "size-8 text-[11px]" }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={`type-numeric inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted font-semibold text-foreground shadow-[var(--shadow-inset-highlight)] ${className}`}>
      {monogram(name)}
    </span>
  );
}

/** Bas de sidebar : identité + menu (plateforme si autorisé, déconnexion). */
export function UserMenu({ user, isPlatformAdmin, platformActive }: { user: ShellUser; isPlatformAdmin: boolean; platformActive: boolean }) {
  return (
    <Popover
      label="Menu du compte"
      side="top"
      className="w-full"
      panelClassName="w-full"
      trigger={({ toggle, ...aria }) => (
        <button type="button" onClick={toggle} {...aria} className="flex min-h-12 w-full items-center gap-3 rounded-[12px] px-2 text-left transition-colors duration-150 hover:bg-surface-muted aria-expanded:bg-surface-muted">
          <UserAvatar name={user.displayName} />
          <span className="text-reflow flex flex-1 flex-col">
            <span className="truncate text-sm font-medium leading-tight text-foreground">{user.displayName}</span>
            {user.email && user.email !== user.displayName ? <span className="truncate text-xs leading-tight text-muted">{user.email}</span> : null}
          </span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-subtle" />
        </button>
      )}
    >
      {(close) => (
        <>
          {isPlatformAdmin && !platformActive ? (
            <Link role="menuitem" href="/platform/clubs" onClick={close} className={menuItemClass}>
              <ShieldCheck aria-hidden />
              Administration plateforme
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={menuItemClass}>
              <LogOut aria-hidden />
              Se déconnecter
            </button>
          </form>
        </>
      )}
    </Popover>
  );
}
