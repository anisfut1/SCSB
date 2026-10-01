import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type PoolStandingsDto = components["schemas"]["PoolStandingsDto"];
export type StandingRowDto = components["schemas"]["StandingRowDto"];

/** GET /v1/clubs/:clubId/standings — classements FFBB des poules où le club est engagé (tout membre du club). */
export async function listStandings(fetcher: ApiFetcher, clubId: string): Promise<PoolStandingsDto[]> {
  const { standings } = await fetcher<{ standings: PoolStandingsDto[] }>(`/v1/clubs/${clubId}/standings`);
  return standings;
}
