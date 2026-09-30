"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, ChevronDown, MapPin, RotateCcw, Search, Shirt, SlidersHorizontal } from "lucide-react";
import { SegmentedControl, type SegmentItem } from "@/components/ui/SegmentedControl";
import { Popover, menuItemClass } from "@/components/ui/Popover";
import { Sheet } from "@/components/ui/Sheet";
import { Button, buttonClasses } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

export interface FilterOption {
  label: string;
  href: string;
  active: boolean;
}

const triggerClass =
  "inline-flex h-10 min-w-0 items-center gap-2 rounded-md border border-border bg-surface-raised px-3 text-sm text-foreground shadow-1 transition-[border-color,box-shadow] duration-150 hover:border-border-strong aria-expanded:border-accent aria-expanded:shadow-glow-xs [&_svg]:size-4 [&_svg]:shrink-0";

/** Menu déroulant de liens (Lieu). */
function OptionMenu({ label, icon, options }: { label: string; icon: React.ReactNode; options: FilterOption[] }) {
  const current = options.find((o) => o.active) ?? options[0];
  return (
    <Popover
      label={label}
      panelClassName="w-56"
      trigger={({ toggle, ...aria }) => (
        <button type="button" onClick={toggle} {...aria} className={triggerClass}>
          <span aria-hidden className="text-subtle">{icon}</span>
          <span className="sr-only">{label} : </span>
          <span className="truncate">{current?.label}</span>
          <ChevronDown aria-hidden className="text-subtle" />
        </button>
      )}
    >
      {(close) =>
        options.map((option) => (
          <Link key={option.href} role="menuitemradio" aria-checked={option.active} href={option.href} scroll={false} onClick={close} className={menuItemClass}>
            <span className="flex-1">{option.label}</span>
            {option.active ? <Check aria-hidden className="!text-accent-text" /> : null}
          </Link>
        ))
      }
    </Popover>
  );
}

/** Combobox équipe : champ de recherche + liste filtrée (navigation clavier native par Tab). */
function TeamCombobox({ options, onPick, autoFocus = true }: { options: FilterOption[]; onPick?: () => void; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  return (
    <div className="flex flex-col gap-1">
      <label className="relative block">
        <span className="sr-only">Rechercher une équipe</span>
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <input
          type="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault();
              router.push(filtered[0].href, { scroll: false });
              onPick?.();
            }
          }}
          placeholder="Rechercher une équipe"
          className="h-10 w-full rounded-[9px] border border-border bg-surface pl-9 pr-3 text-[16px] outline-none focus-visible:border-accent focus-visible:shadow-glow-xs sm:text-sm"
        />
      </label>
      <div role="listbox" aria-label="Équipes" className="max-h-72 overflow-y-auto">
        {filtered.length === 0 ? <p className="type-meta px-2.5 py-3">Aucune équipe ne correspond.</p> : null}
        {filtered.map((option) => (
          <Link key={option.href} role="option" aria-selected={option.active} href={option.href} scroll={false} onClick={onPick} className={menuItemClass}>
            <span className="flex-1 truncate">{option.label}</span>
            {option.active ? <Check aria-hidden className="!text-accent-text" /> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Barre de filtres des matchs. Desktop : période en contrôle segmenté +
 * Lieu (menu) + Équipe (combobox). Mobile : période segmentée pleine
 * largeur + bouton « Filtres » ouvrant une feuille. Tous les états sont des
 * liens (URL = source de vérité, construite côté serveur).
 */
export function MatchFilters({ when, side, teams, resetHref }: { when: SegmentItem[]; side: FilterOption[]; teams: FilterOption[]; resetHref: string | null }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeTeam = teams.find((t) => t.active && t.label !== "Toutes les équipes");
  const activeSide = side.find((s) => s.active);
  const extraCount = (activeTeam ? 1 : 0) + (activeSide && activeSide !== side[0] ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <SegmentedControl items={when} label="Période" className="flex-1" />
        <Button variant="secondary" onClick={() => setSheetOpen(true)} icon={<SlidersHorizontal />} className="relative shrink-0 px-3" aria-label={`Filtres${extraCount ? ` (${extraCount} actifs)` : ""}`}>
          {extraCount ? <span className="type-numeric inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] text-accent-ink">{extraCount}</span> : null}
        </Button>
      </div>
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtres"
        side="bottom"
        footer={
          resetHref ? (
            <Link href={resetHref} scroll={false} onClick={() => setSheetOpen(false)} className={buttonClasses({ variant: "ghost", className: "w-full" })}>
              <RotateCcw aria-hidden />
              Réinitialiser
            </Link>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="type-eyebrow mb-2">Lieu</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {side.map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  scroll={false}
                  onClick={() => setSheetOpen(false)}
                  aria-current={option.active ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-center rounded-md border px-2 text-center text-[13px] font-medium transition-colors duration-150",
                    option.active ? "border-accent-border bg-accent-soft text-accent-text shadow-glow-xs" : "border-border bg-surface-raised text-muted",
                  )}
                >
                  {option.label === "Tous les lieux" ? "Tous" : option.label}
                </Link>
              ))}
            </div>
          </fieldset>
          {teams.length > 1 ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="type-eyebrow mb-2">Équipe</legend>
              <TeamCombobox options={teams} onPick={() => setSheetOpen(false)} autoFocus={false} />
            </fieldset>
          ) : null}
        </div>
      </Sheet>

      {/* Desktop / tablette */}
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        <SegmentedControl items={when} label="Période" />
        <span aria-hidden className="mx-1 h-6 w-px bg-border" />
        <OptionMenu label="Lieu" icon={<MapPin />} options={side} />
        {teams.length > 1 ? (
          <Popover
            label="Équipe"
            panelClassName="w-72"
            trigger={({ toggle, ...aria }) => (
              <button type="button" onClick={toggle} {...aria} className={cn(triggerClass, "max-w-[260px]")}>
                <Shirt aria-hidden className="text-subtle" />
                <span className="sr-only">Équipe : </span>
                <span className="truncate">{activeTeam?.label ?? "Toutes les équipes"}</span>
                <ChevronDown aria-hidden className="text-subtle" />
              </button>
            )}
          >
            {(close) => <TeamCombobox options={teams} onPick={close} />}
          </Popover>
        ) : null}
        {resetHref ? (
          <Link href={resetHref} scroll={false} className={buttonClasses({ variant: "ghost", size: "sm" })}>
            <RotateCcw aria-hidden />
            Réinitialiser
          </Link>
        ) : null}
      </div>
    </div>
  );
}
