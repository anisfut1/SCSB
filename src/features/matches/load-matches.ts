import type { TeamDto } from "@/lib/api/clubs";
import type { ListMatchesParams, MatchListItemDto } from "@/lib/api/matches";
import type { MatchFiltersState } from "./match-filters";

/**
 * Paramètres de requête serveur pour la liste des matchs (LOT-06,
 * `FF_MATCHES_SERVER_FILTERS`). Reproduit EXACTEMENT le filtrage local de
 * `applyMatchFilters` (équipe, lieu, période) en le déléguant à l'API :
 *  - équipe : `teamId` seulement si l'id figure dans `teams` (un id inconnu
 *    est ignoré par le filtre local, jamais transmis à l'API) ;
 *  - lieu : `homeAway` ;
 *  - période : `from`/`to` (jamais `period=weekend`, sémantique non confirmée,
 *    Q-014). « À venir » → `from = now`, « Passés » → `to = now`.
 * Le mode « Journée » garde toute la saison : le sélecteur de journée a besoin
 * des comptes par semaine de la saison entière, qu'aucun endpoint ne fournit
 * encore (`04-contrats-api.md` B.3, `/matches/weekends`). Le filtrage local
 * reste appliqué ensuite par la vue (idempotent) : garantie de parité.
 */
export function buildServerMatchQuery(filters: MatchFiltersState, teams: readonly TeamDto[], seasonStart: Date, now: Date): ListMatchesParams {
  const query: ListMatchesParams = { from: seasonStart.toISOString() };

  if (filters.team && teams.some((team) => team.id === filters.team)) query.teamId = filters.team;
  if (filters.side !== "all") query.homeAway = filters.side;

  if (filters.when === "upcoming") query.from = now.toISOString();
  else if (filters.when === "past") query.to = now.toISOString();

  return query;
}

/**
 * Charge équipes + matchs pour la vue « Matchs » (club ou public).
 * Flag désactivé : comportement historique (saison entière, en parallèle).
 * Flag activé : filtres serveur ; si une équipe est choisie, les équipes sont
 * chargées d'abord pour valider l'identifiant (un aller-retour de plus,
 * volontaire, pour garder la parité avec le filtrage local).
 */
export async function loadMatchesForView(options: {
  serverFilters: boolean;
  filters: MatchFiltersState;
  seasonStart: Date;
  now: Date;
  fetchTeams: () => Promise<TeamDto[]>;
  fetchMatches: (params: ListMatchesParams) => Promise<MatchListItemDto[]>;
}): Promise<{ teams: TeamDto[]; matches: MatchListItemDto[] }> {
  const { serverFilters, filters, seasonStart, now, fetchTeams, fetchMatches } = options;
  const seasonOnly: ListMatchesParams = { from: seasonStart.toISOString() };

  if (!serverFilters) {
    const [teams, matches] = await Promise.all([fetchTeams(), fetchMatches(seasonOnly)]);
    return { teams, matches };
  }

  if (filters.team) {
    const teams = await fetchTeams();
    return { teams, matches: await fetchMatches(buildServerMatchQuery(filters, teams, seasonStart, now)) };
  }

  const [teams, matches] = await Promise.all([fetchTeams(), fetchMatches(buildServerMatchQuery(filters, [], seasonStart, now))]);
  return { teams, matches };
}
