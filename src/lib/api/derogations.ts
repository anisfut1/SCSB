import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type DerogationListItemDto = components["schemas"]["DerogationListItemDto"];

/**
 * GET /v1/clubs/:clubId/derogations — liste de toutes les dérogations FBI
 * connues du club, alimentée par le job `check_all_derogations` (bouton
 * global "Vérifier toutes les dérogations", voir integrations.ts). Chaque
 * ligne est déjà enrichie du match FFBB correspondant (`matchId`,
 * `opponentName`, `matchDatetime`) — FFBB reste la source du match,
 * jamais remplacée par FBI. Lecture seule uniquement.
 */
export async function listDerogations(fetcher: ApiFetcher, clubId: string): Promise<DerogationListItemDto[]> {
  const { derogations } = await fetcher<{ derogations: DerogationListItemDto[] }>(`/v1/clubs/${clubId}/derogations`);
  return derogations;
}
