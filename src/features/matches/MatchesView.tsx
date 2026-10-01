import { CalendarDays, CalendarSearch, House, Route } from "lucide-react";
import type { TeamDto } from "@/lib/api/clubs";
import type { MatchListItemDto } from "@/lib/api/matches";
import { EmptyState } from "@/components/ui/States";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { HomeMatchesAgenda } from "./HomeMatchesAgenda";
import { MatchCard, type MatchCardClub } from "./MatchCard";
import { MatchFilters } from "./MatchFilters";
import { SIDE_OPTIONS, WHEN_OPTIONS, applyMatchFilters, buildFilterHref, defaultWeekend, groupMatchesByWeekend, weekendOptions, type MatchFiltersState, type WeekendGroup } from "./match-filters";
import { JourneePicker, type JourneeOption } from "./JourneePicker";
import { formatWeekendLabel } from "@/lib/timezone";

/**
 * Liste des matchs filtrée (vue club ET vue publique — même rendu, seules
 * la source des données et `basePath` diffèrent).
 */
export function MatchesView({
  all,
  teams,
  filters,
  basePath,
  club,
}: {
  all: MatchListItemDto[];
  teams: TeamDto[];
  filters: MatchFiltersState;
  basePath: string;
  club: MatchCardClub;
}) {
  const matches = applyMatchFilters(all, teams, filters);
  const href = (changes: Partial<MatchFiltersState>) => buildFilterHref(basePath, filters, changes);
  const isDefault = filters.when === "weekend" && filters.side === "all" && !filters.team && !filters.weekend;

  // Sélecteur de journée (mode « Journée ») : la journée affichée + toutes
  // celles de la saison qui ont des matchs (après filtres équipe/lieu).
  const currentSaturday = defaultWeekend();
  const selectedSaturday = filters.weekend ?? currentSaturday;
  let journees = weekendOptions(all, teams, filters);
  if (!journees.some((o) => o.saturday === selectedSaturday)) {
    journees = [...journees, { saturday: selectedSaturday, label: formatWeekendLabel(selectedSaturday), count: 0 }].sort((a, b) => a.saturday.localeCompare(b.saturday));
  }
  const journeeHref = (saturday: string) => href({ when: "weekend", weekend: saturday === currentSaturday ? null : saturday });
  const journeeOptions: JourneeOption[] = journees.map((o) => ({ ...o, href: journeeHref(o.saturday), active: o.saturday === selectedSaturday, isCurrent: o.saturday === currentSaturday }));
  const selectedIndex = journees.findIndex((o) => o.saturday === selectedSaturday);
  const prevJournee = journees.slice(0, selectedIndex).reverse().find((o) => o.count > 0) ?? null;
  const nextJournee = journees.slice(selectedIndex + 1).find((o) => o.count > 0) ?? null;

  const periodLabel = WHEN_OPTIONS.find((o) => o.value === filters.when)?.label.toLowerCase() ?? "";

  return (
    <div className="flex flex-col gap-8">
      <MatchFilters
        when={WHEN_OPTIONS.map((o) => ({ label: o.label, href: href({ when: o.value }), active: filters.when === o.value }))}
        side={SIDE_OPTIONS.map((o) => ({ label: o.label, href: href({ side: o.value }), active: filters.side === o.value }))}
        teams={[{ label: "Toutes les équipes", href: href({ team: null }), active: !filters.team }, ...teams.map((t) => ({ label: t.name, href: href({ team: t.id }), active: filters.team === t.id }))]}
        resetHref={isDefault ? null : basePath}
      />

      {filters.when === "weekend" ? (
        <JourneePicker
          options={journeeOptions}
          prevHref={prevJournee ? journeeHref(prevJournee.saturday) : null}
          nextHref={nextJournee ? journeeHref(nextJournee.saturday) : null}
          currentHref={selectedSaturday !== currentSaturday ? journeeHref(currentSaturday) : null}
        />
      ) : null}

{filters.when !== "weekend" ? (
      <p className="type-meta -mt-4" aria-live="polite">
        <span className="type-numeric font-medium text-foreground">{matches.length}</span> match{matches.length > 1 ? "s" : ""} · {periodLabel}
      </p>
) : null}

      {matches.length === 0 ? (
        <EmptyState
          icon={<CalendarSearch />}
          title={filters.when === "weekend" ? "Aucun match cette journée" : "Aucun match ne correspond"}
          description="Élargissez la période ou retirez un filtre pour voir d'autres rencontres de la saison."
          action={
            filters.when === "weekend" && nextJournee ? (
              <ButtonLink href={journeeHref(nextJournee.saturday)} variant="secondary" scroll={false}>
                Voir la journée suivante
              </ButtonLink>
            ) : !isDefault ? (
              <ButtonLink href={basePath} variant="secondary" scroll={false}>
                Réinitialiser les filtres
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-12">
          {groupMatchesByWeekend(matches).map((group) => (
            <WeekendSection key={group.saturday} group={group} basePath={basePath} club={club} showHeader={filters.when !== "weekend"} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Une journée (week-end) : en-tête daté, puis matchs à domicile par salle
 * ("Pour les matchs à domicile, faut faire 2 colonnes car là il y a 2
 * gymnases pour le club de sète" — demande du club, 2026-09-28, voir
 * HomeMatchesAgenda) et matchs à l'extérieur.
 */
function WeekendSection({ group, basePath, club, showHeader }: { group: WeekendGroup; basePath: string; club: MatchCardClub; showHeader: boolean }) {
  const homeMatches = group.matches.filter((m) => m.isHome === true);
  const otherMatches = group.matches.filter((m) => m.isHome !== true);
  const titleId = `journee-${group.saturday}`;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      {showHeader ? (
      <div className="surface-glass sticky top-[var(--topbar-height)] z-10 -mx-4 flex items-center justify-between gap-3 border-y border-border px-4 py-2.5 sm:mx-0 sm:rounded-[var(--radius-md)] sm:border-x sm:px-4">
        <h2 id={titleId} className="type-section flex items-center gap-2 text-foreground">
          <CalendarDays aria-hidden className="size-4 text-accent-text" />
          <span className="first-letter:uppercase">{group.label}</span>
        </h2>
        <span className="type-numeric shrink-0 text-xs text-muted">
          {group.matches.length} match{group.matches.length > 1 ? "s" : ""}
          {homeMatches.length > 0 ? ` · ${homeMatches.length} à domicile` : ""}
        </span>
      </div>
      ) : (
        <h2 id={titleId} className="sr-only">{group.label}</h2>
      )}

      {homeMatches.length > 0 ? (
        <div className="flex flex-col gap-4">
          <SectionHeader as="h3" icon={<House />} title="À domicile" description="Par salle — une colonne par gymnase du club." />
          <HomeMatchesAgenda matches={homeMatches} basePath={basePath} club={club} />
        </div>
      ) : null}

      {otherMatches.length > 0 ? (
        <div className="flex flex-col gap-4">
          <SectionHeader as="h3" icon={<Route />} title="À l'extérieur" />
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {otherMatches.map((match) => (
              <li key={match.id}>
                <MatchCard match={match} href={`${basePath}/${match.id}`} club={club} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
