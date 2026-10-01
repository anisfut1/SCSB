"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import { Popover, menuItemClass } from "@/components/ui/Popover";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

export interface JourneeOption {
  saturday: string;
  label: string;
  count: number;
  href: string;
  active: boolean;
  isCurrent: boolean;
}

/** « Week-end du 3 au 4 octobre » → « 3 – 4 octobre » (bouton compact en mobile). */
function shortLabel(label: string): string {
  return label.replace(/^Week-end du /, "").replace(" au ", " – ");
}

function JourneeList({ options, close }: { options: JourneeOption[]; close: () => void }) {
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div role="listbox" aria-label="Journées de la saison" className="max-h-80 overflow-y-auto overscroll-contain">
      {options.map((option) => (
        <Link
          key={option.saturday}
          ref={option.active ? activeRef : undefined}
          role="option"
          aria-selected={option.active}
          href={option.href}
          scroll={false}
          onClick={close}
          className={cn(menuItemClass, "min-h-11", option.active && "bg-accent-softer")}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{option.label}</span>
            {option.isCurrent ? <span className="text-xs text-accent-text">Cette semaine</span> : null}
          </span>
          <span className="type-numeric shrink-0 text-xs text-muted">
            {option.count} match{option.count > 1 ? "s" : ""}
          </span>
          {option.active ? <Check aria-hidden className="!text-accent-text" /> : <span className="w-4 shrink-0" />}
        </Link>
      ))}
    </div>
  );
}

/**
 * Sélecteur de journée (= week-end, matchs de la semaine inclus) — retour du
 * club, 2026-10-01 : « faut un sélecteur en haut pour choisir sa journée, ou
 * sa semaine ». Précédente / suivante sautent aux journées qui ont des matchs ;
 * la liste donne accès à toute la saison. Tout est lien (URL = état).
 */
export function JourneePicker({ options, prevHref, nextHref, currentHref }: { options: JourneeOption[]; prevHref: string | null; nextHref: string | null; currentHref: string | null }) {
  const active = options.find((o) => o.active);
  const arrow = buttonClasses({ variant: "secondary", className: "w-11 shrink-0 px-0 sm:w-10" });

  return (
    <nav aria-label="Choisir la journée" className="flex min-w-0 items-center gap-2">
      {prevHref ? (
        <Link href={prevHref} scroll={false} aria-label="Journée précédente" title="Journée précédente" className={arrow}>
          <ChevronLeft aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, "opacity-40")}>
          <ChevronLeft />
        </span>
      )}

      <Popover
        label="Journées de la saison"
        className="min-w-0 flex-1 sm:flex-none"
        panelClassName="w-[min(22rem,calc(100vw-2rem))]"
        trigger={({ toggle, ...aria }) => (
          <button
            type="button"
            onClick={toggle}
            {...aria}
            className="flex min-h-11 w-full min-w-0 items-center gap-2.5 rounded-md border border-border bg-surface-raised px-3 text-left shadow-1 transition-[border-color,box-shadow] duration-150 hover:border-border-strong aria-expanded:border-accent aria-expanded:shadow-glow-xs sm:min-h-10 sm:min-w-[300px]"
          >
            <CalendarDays aria-hidden className="size-4 shrink-0 text-accent-text" />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-foreground">
                {active ? (
                  <>
                    <span className="sm:hidden">{shortLabel(active.label)}</span>
                    <span className="hidden sm:inline">{active.label}</span>
                  </>
                ) : (
                  "Choisir une journée"
                )}
              </span>
              {active ? (
                <span className="type-meta truncate text-xs">
                  {active.count} match{active.count > 1 ? "s" : ""}
                  {active.isCurrent ? " · cette semaine" : ""}
                </span>
              ) : null}
            </span>
            <ChevronDown aria-hidden className="size-4 shrink-0 text-subtle" />
          </button>
        )}
      >
        {(close) => <JourneeList options={options} close={close} />}
      </Popover>

      {nextHref ? (
        <Link href={nextHref} scroll={false} aria-label="Journée suivante" title="Journée suivante" className={arrow}>
          <ChevronRight aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, "opacity-40")}>
          <ChevronRight />
        </span>
      )}

      {currentHref ? (
        <Link href={currentHref} scroll={false} className={buttonClasses({ variant: "ghost", size: "sm", className: "hidden sm:inline-flex" })}>
          <Undo2 aria-hidden />
          Cette semaine
        </Link>
      ) : null}
    </nav>
  );
}
