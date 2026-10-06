import type { ApiFetcher } from "./client";
import type { paths } from "./generated/schema";

export type EmarqueTrackingDto = paths["/v1/clubs/{clubId}/emarque-tracking"]["get"]["responses"][200]["content"]["application/json"];
export type EmarqueTrackingMatchDto = EmarqueTrackingDto["matches"][number];
export type EmarqueTrackingState = EmarqueTrackingMatchDto["state"];
export type EmarqueTrackingRelaunchDto = paths["/v1/clubs/{clubId}/emarque-tracking/{matchId}/relaunch"]["post"]["responses"][202]["content"]["application/json"];

/** GET /v1/clubs/:clubId/emarque-tracking — état de récupération des stats de chaque match joué (admin du club). */
export async function listEmarqueTracking(fetcher: ApiFetcher, clubId: string): Promise<EmarqueTrackingMatchDto[]> {
  const { matches } = await fetcher<EmarqueTrackingDto>(`/v1/clubs/${clubId}/emarque-tracking`);
  return matches;
}

/** POST /v1/clubs/:clubId/emarque-tracking/:matchId/relaunch — essai au prochain passage, puis 7 jours au calendrier fixe. */
export async function relaunchEmarqueTracking(fetcher: ApiFetcher, clubId: string, matchId: string): Promise<EmarqueTrackingRelaunchDto> {
  return fetcher<EmarqueTrackingRelaunchDto>(`/v1/clubs/${clubId}/emarque-tracking/${matchId}/relaunch`, { method: "POST" });
}
