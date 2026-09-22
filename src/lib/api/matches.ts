import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type MatchListItemDto = components["schemas"]["MatchListItemDto"];
export type MatchDetailsDto = components["schemas"]["MatchDetailsDto"];
export type MatchDocumentDto = components["schemas"]["MatchDocumentDto"];

/**
 * GET /v1/clubs/:clubId/matches — §14 de la demande.
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : l'API ne supporte pas
 * encore de filtres en query params (période, équipe, domicile/extérieur)
 * ni de pagination — elle renvoie tous les matchs du club. Le filtrage
 * "ce week-end / à venir / passés / équipe / domicile-extérieur" est donc
 * fait côté frontend (voir app/c/[clubSlug]/matchs/page.tsx), acceptable
 * pour le volume actuel (quelques dizaines à quelques centaines de matchs
 * par club et par saison) mais PAS une solution définitive.
 */
export async function listMatches(fetcher: ApiFetcher, clubId: string): Promise<MatchListItemDto[]> {
  const { matches } = await fetcher<{ matches: MatchListItemDto[] }>(`/v1/clubs/${clubId}/matches`);
  return matches;
}

/** GET /v1/clubs/:clubId/matches/:matchId — §15 de la demande. */
export async function getMatch(fetcher: ApiFetcher, clubId: string, matchId: string): Promise<MatchDetailsDto> {
  return fetcher<MatchDetailsDto>(`/v1/clubs/${clubId}/matches/${matchId}`);
}

/** GET /v1/clubs/:clubId/matches/:matchId/documents — §25 de la demande : `downloadUrl` (signée, courte durée) uniquement pour un club_admin. */
export async function listMatchDocuments(fetcher: ApiFetcher, clubId: string, matchId: string): Promise<MatchDocumentDto[]> {
  const { documents } = await fetcher<{ documents: MatchDocumentDto[] }>(`/v1/clubs/${clubId}/matches/${matchId}/documents`);
  return documents;
}
