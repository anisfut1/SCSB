import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

/**
 * `opponentLogoUrl` ajouté côté API après la dernière génération de ce
 * schéma (ce sandbox ne peut pas joindre l'API déployée pour relancer
 * `npm run api:generate`, voir docs/API_CLIENT.md) — étendu ici plutôt
 * que de toucher au fichier auto-généré. URL publique confirmée
 * accessible sans authentification (testée en direct par le club,
 * 2026-09-22) : une balise <img> suffit, pas de proxy nécessaire.
 */
export type MatchListItemDto = components["schemas"]["MatchListItemDto"] & { opponentLogoUrl: string | null };
export type MatchDetailsDto = components["schemas"]["MatchDetailsDto"] & { opponentLogoUrl: string | null };
export type MatchDocumentDto = components["schemas"]["MatchDocumentDto"];

/**
 * `pagination` renvoyé par l'API (voir club-manager-api/src/modules/matches/routes.ts)
 * mais absent du schéma OpenAPI généré ici — généré avant l'ajout des
 * filtres/pagination côté API (gap 7) et jamais régénéré depuis (ce
 * sandbox ne peut pas joindre l'API déployée pour relancer `npm run
 * api:generate`, voir docs/API_CLIENT.md). Déclaré ici manuellement plutôt
 * que de toucher au fichier auto-généré.
 */
interface MatchesListResponse {
  matches: MatchListItemDto[];
  pagination: { limit: number; offset: number; total: number };
}

export interface ListMatchesParams {
  /** Filtre `match_datetime >= from` (ISO 8601) — voir §14/gap 7 de la demande. */
  from?: string;
  to?: string;
}

/**
 * GET /v1/clubs/:clubId/matches — §14 de la demande.
 *
 * Filtre par date CÔTÉ API (`from`/`to`) plutôt que de récupérer tous les
 * matchs du club puis filtrer côté frontend : sans `from`, l'API renvoie
 * par défaut les 50 matchs les PLUS ANCIENS (limite par défaut + tri
 * croissant, voir MatchesQueryDtoSchema côté club-manager-api) — c'est ce
 * qui faisait apparaître uniquement les matchs de 2023 alors que le club a
 * un historique jusqu'à aujourd'hui. Pagine ensuite explicitement
 * (`limit`/`offset`, jamais un seul appel supposé tout ramener) jusqu'à
 * avoir récupéré `pagination.total` résultats — même logique défensive
 * que `FfbbDirectusClient.listAllItems` côté club-manager-api : un club
 * avec beaucoup de matchs sur la période demandée ne doit jamais perdre
 * silencieusement les plus récents.
 */
export async function listMatches(fetcher: ApiFetcher, clubId: string, params: ListMatchesParams = {}): Promise<MatchListItemDto[]> {
  const PAGE_SIZE = 200; // MAX_MATCHES_LIMIT côté API — voir MatchesQueryDtoSchema
  const matches: MatchListItemDto[] = [];
  let offset = 0;

  for (;;) {
    const search = new URLSearchParams();
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    search.set("limit", String(PAGE_SIZE));
    search.set("offset", String(offset));

    const page = await fetcher<MatchesListResponse>(`/v1/clubs/${clubId}/matches?${search.toString()}`);
    matches.push(...page.matches);

    offset += PAGE_SIZE;
    if (page.matches.length < PAGE_SIZE || offset >= page.pagination.total) break;
  }

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
