import { CalendarSearch, House, Route } from "lucide-react";
import type { TeamDto } from "@/lib/api/clubs";
import type { MatchListItemDto } from "@/lib/api/matches";
import { EmptyState } from "@/components/ui/States";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { HomeMatchesAgenda } from "./HomeMatchesAgenda";
import { MatchCard, type MatchCardClub } from "./MatchCard";
import { MatchFilters } from "./MatchFilters";
import { SIDE_OPTIONS, WHEN_OPTIONS, applyMatchFilters, buildFilterHref, type MatchFiltersState } from "./match-filters";

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

  // "Pour les matchs à domicile, faut faire 2 colonnes car là il y a 2
  // gymnases pour le club de sète. Je veux un rendu type agenda carré
  // propre premium" (demande du club, 2026-09-28) — voir HomeMatchesAgenda.
  const homeMatches = matches.filter((m) => m.isHome === true);
  const otherMatches = matches.filter((m) => m.isHome !== true);
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
        <div className="flex flex-col gap-10">
          {homeMatches.length > 0 ? (
            <section className="flex flex-col gap-4">
              <SectionHeader icon={<House />} title="À domicile" description="Par salle — une colonne par gymnase du club." />
              <HomeMatchesAgenda matches={homeMatches} basePath={basePath} club={club} />
            </section>
          ) : null}

          {otherMatches.length > 0 ? (
            <section className="flex flex-col gap-4">
              {homeMatches.length > 0 ? <SectionHeader icon={<Route />} title="À l'extérieur" /> : null}
              <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {otherMatches.map((match) => (
                  <li key={match.id}>
                    <MatchCard match={match} href={`${basePath}/${match.id}`} club={club} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
