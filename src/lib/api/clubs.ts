import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type ClubDto = components["schemas"]["ClubDto"];
export type ClubRole = components["schemas"]["ClubRole"];
export type ClubCapabilities = components["schemas"]["ClubCapabilities"];
export type TeamDto = components["schemas"]["TeamDto"];

/** GET /v1/clubs — clubs dont l'utilisateur est membre actif (§11 de la demande). */
export async function listClubs(fetcher: ApiFetcher): Promise<ClubDto[]> {
  const { clubs } = await fetcher<{ clubs: ClubDto[] }>("/v1/clubs");
  return clubs;
}

/** GET /v1/clubs/:clubId */
export async function getClub(fetcher: ApiFetcher, clubId: string): Promise<ClubDto> {
  return fetcher<ClubDto>(`/v1/clubs/${clubId}`);
}

/** GET /v1/clubs/:clubId/capabilities — §16 de la demande : jamais recalculé côté frontend. */
export async function getClubCapabilities(fetcher: ApiFetcher, clubId: string): Promise<ClubCapabilities> {
  return fetcher<ClubCapabilities>(`/v1/clubs/${clubId}/capabilities`);
}

/** GET /v1/clubs/:clubId/teams */
export async function listTeams(fetcher: ApiFetcher, clubId: string): Promise<TeamDto[]> {
  const { teams } = await fetcher<{ teams: TeamDto[] }>(`/v1/clubs/${clubId}/teams`);
  return teams;
}
