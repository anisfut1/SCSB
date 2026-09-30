import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type MeDto = components["schemas"]["MeDto"];

/** GET /v1/me — identité de session (nom d'affichage pour le shell, jamais une donnée métier). */
export async function getMe(fetcher: ApiFetcher): Promise<MeDto> {
  return fetcher<MeDto>("/v1/me");
}
