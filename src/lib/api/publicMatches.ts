import { apiFetch } from "./client";
import type { TeamDto } from "./clubs";
import type { DerogationStatusDto, MatchDetailsDto, MatchDocumentDto, MatchListItemDto } from "./matches";
import { matchesFilterSearchParams, type ListMatchesParams } from "./matches";
import type { PoolStandingsDto } from "./standings";

export type { PoolStandingsDto, StandingRowDto } from "./standings";

/**
 * Client HTTP pour la vue PUBLIQUE en lecture seule des matchs (retour du
 * club, 2026-09-29 : "je veux une vue publique avec toutes les infos en
 * vue directe... sans compte, en libre service"). Contrairement à
 * `publicTables.ts` (auto-affectation), il n'y a ICI aucune identité à
 * prouver — pas de jeton, pas de `?token=` : seul le `clubSlug` de l'URL
 * compte. Utilise `apiFetch` directement (jamais `browserApi`/`api.server`,
 * qui attachent un jeton Supabase) — voir club-manager-api/docs/PUBLIC_MATCHES.md.
 */

export interface PublicMatchesListResponse {
  matches: MatchListItemDto[];
  pagination: { limit: number; offset: number; total: number };
}

/** GET /v1/public/clubs/:clubSlug/teams — pour le filtre "équipe". */
export async function listPublicTeams(clubSlug: string): Promise<TeamDto[]> {
  const { teams } = await apiFetch<{ teams: TeamDto[] }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/teams`);
  return teams;
}

/** GET /v1/public/clubs/:clubSlug/matches — mêmes filtres que la vue authentifiée (voir `./matches.ts#listMatches`), sans pagination automatique ici (la vue publique n'affiche que la saison en cours, un seul appel suffit). */
export async function listPublicMatches(clubSlug: string, params: ListMatchesParams = {}): Promise<MatchListItemDto[]> {
  const search = matchesFilterSearchParams(params);
  search.set("limit", "200");
  const query = search.toString();
  const { matches } = await apiFetch<PublicMatchesListResponse>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches${query ? `?${query}` : ""}`);
  return matches;
}

/** GET /v1/public/clubs/:clubSlug/matches/:matchId */
export async function getPublicMatch(clubSlug: string, matchId: string): Promise<MatchDetailsDto> {
  return apiFetch<MatchDetailsDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}`);
}

/** GET /v1/public/clubs/:clubSlug/matches/:matchId/documents — `downloadUrl` toujours `null` (jamais d'URL signée en public, voir docs/PUBLIC_MATCHES.md). */
export async function listPublicMatchDocuments(clubSlug: string, matchId: string): Promise<MatchDocumentDto[]> {
  const { documents } = await apiFetch<{ documents: MatchDocumentDto[] }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/documents`);
  return documents;
}

/** GET /v1/public/clubs/:clubSlug/matches/:matchId/derogation — lecture seule, dernier état connu. */
export async function getPublicMatchDerogation(clubSlug: string, matchId: string): Promise<DerogationStatusDto | null> {
  const { derogation } = await apiFetch<{ derogation: DerogationStatusDto | null }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/matches/${matchId}/derogation`);
  return derogation;
}

/** GET /v1/public/clubs/:clubSlug/standings — classements FFBB des poules où le club est engagé (copiés à chaque synchronisation). */
export async function listPublicStandings(clubSlug: string): Promise<PoolStandingsDto[]> {
  const { standings } = await apiFetch<{ standings: PoolStandingsDto[] }>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/standings`);
  return standings;
}
