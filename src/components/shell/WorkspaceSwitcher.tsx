"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { ClubLogo } from "@/components/ui/Logo";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/components/ui/cn";
import { Popover, menuItemClass } from "@/components/ui/Popover";
import type { ShellWorkspace } from "./types";

/**
 * En-tête de sidebar : espace courant (club ou plateforme). Le sélecteur ne
 * s'ouvre que si l'utilisateur a plusieurs clubs — sinon simple identité.
 */
export function WorkspaceSwitcher({ current, workspaces, platformLabel }: { current: ShellWorkspace | null; workspaces: ShellWorkspace[]; platformLabel: string }) {
  const identity = (
    <>
      {current ? <ClubLogo name={current.name} src={current.logoUrl} size="sm" /> : <BrandMark />}
      <span className="text-reflow flex flex-1 flex-col text-left">
        <span className="truncate text-sm font-semibold leading-tight text-foreground">{current?.name ?? platformLabel}</span>
        <span className="truncate text-xs leading-tight text-muted">{current ? "Espace club" : "Administration plateforme"}</span>
      </span>
    </>
  );

  if (workspaces.length <= 1 && current) {
    return <div className="flex min-h-12 items-center gap-3 rounded-[12px] px-2">{identity}</div>;
  }

  return (
    <Popover
      label="Changer d'espace"
      className="w-full"
      panelClassName="w-full max-h-[60vh] overflow-y-auto"
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={toggle}
          {...aria}
          className="flex min-h-12 w-full items-center gap-3 rounded-[12px] px-2 transition-colors duration-150 hover:bg-surface-muted aria-expanded:bg-surface-muted"
        >
          {identity}
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-subtle" />
        </button>
      )}
    >
      {(close) => (
        <>
          <p className="type-eyebrow px-2.5 pb-1.5 pt-2">Vos clubs</p>
          {workspaces.map((ws) => {
            const active = ws.slug === current?.slug;
            return (
              <Link key={ws.slug} role="menuitem" href={`/c/${ws.slug}/dashboard`} onClick={close} aria-current={active ? "page" : undefined} className={cn(menuItemClass, "min-h-11")}>
                <ClubLogo name={ws.name} src={ws.logoUrl} size="xs" />
                <span className="flex-1 truncate">{ws.name}</span>
                {active ? <Check aria-hidden className="!text-accent-text" /> : null}
              </Link>
            );
          })}
          {workspaces.length > 1 ? (
            <>
              <div className="my-1 h-px bg-border" />
              <Link role="menuitem" href="/" onClick={close} className={menuItemClass}>
                <LayoutGrid aria-hidden />
                Tous mes clubs
              </Link>
            </>
          ) : null}
        </>
      )}
    </Popover>
  );
}
