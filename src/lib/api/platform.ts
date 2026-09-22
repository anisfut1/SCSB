import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type PlatformClubDto = components["schemas"]["PlatformClubDto"];
export type CreateClubDto = components["schemas"]["CreateClubDto"];

/** GET /v1/platform/clubs — §24 de la demande, réservé platform_admin (vérifié côté backend). */
export async function listPlatformClubs(fetcher: ApiFetcher): Promise<PlatformClubDto[]> {
  const { clubs } = await fetcher<{ clubs: PlatformClubDto[] }>("/v1/platform/clubs");
  return clubs;
}

/** POST /v1/platform/clubs — §24 de la demande : invitation gérée par le backend (`inviteUserByEmail`), jamais depuis le frontend. */
export async function createClub(fetcher: ApiFetcher, body: CreateClubDto): Promise<{ clubId: string; slug: string; adminInviteError: string | null }> {
  return fetcher(`/v1/platform/clubs`, { method: "POST", body });
}
