import { CalendarDays, CalendarSearch, House, Route } from "lucide-react";
import type { TeamDto } from "@/lib/api/clubs";
import type { MatchListItemDto } from "@/lib/api/matches";
import { EmptyState } from "@/components/ui/States";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { HomeMatchesAgenda } from "./HomeMatchesAgenda";
import { MatchCard, type MatchCardClub } from "./MatchCard";
import { MatchFilters } from "./MatchFilters";
import { SIDE_OPTIONS, WHEN_OPTIONS, applyMatchFilters, buildFilterHref, groupMatchesByWeekend, type MatchFiltersState, type WeekendGroup } from "./match-filters";

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
  const isDefault = filters.when === "weekend" && filters.side === "all" && !filters.team;

  const periodLabel = WHEN_OPTIONS.find((o) => o.value === filters.when)?.label.toLowerCase() ?? "";

  return (
    <div className="flex flex-col gap-8">
      <MatchFilters
        when={WHEN_OPTIONS.map((o) => ({ label: o.label, href: href({ when: o.value }), active: filters.when === o.value }))}
        side={SIDE_OPTIONS.map((o) => ({ label: o.label, href: href({ side: o.value }), active: filters.side === o.value }))}
        teams={[{ label: "Toutes les équipes", href: href({ team: null }), active: !filters.team }, ...teams.map((t) => ({ label: t.name, href: href({ team: t.id }), active: filters.team === t.id }))]}
        resetHref={isDefault ? null : basePath}
      />

      <p className="type-meta -mt-4" aria-live="polite">
        <span className="type-numeric font-medium text-foreground">{matches.length}</span> match{matches.length > 1 ? "s" : ""} · {periodLabel}
      </p>

      {matches.length === 0 ? (
        <EmptyState
          icon={<CalendarSearch />}
          title={filters.when === "weekend" ? "Aucun match ce week-end" : "Aucun match ne correspond"}
          description="Élargissez la période ou retirez un filtre pour voir d'autres rencontres de la saison."
          action={
            filters.when === "weekend" ? (
              <ButtonLink href={href({ when: "upcoming" })} variant="secondary" scroll={false}>
                Voir les matchs à venir
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
            <WeekendSection key={group.saturday} group={group} basePath={basePath} club={club} />
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
function WeekendSection({ group, basePath, club }: { group: WeekendGroup; basePath: string; club: MatchCardClub }) {
  const homeMatches = group.matches.filter((m) => m.isHome === true);
  const otherMatches = group.matches.filter((m) => m.isHome !== true);
  const titleId = `journee-${group.saturday}`;

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
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
