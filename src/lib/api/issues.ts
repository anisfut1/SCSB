import type { ApiFetcher } from "./client";
import type { components } from "./generated/schema";

export type IssueDto = components["schemas"]["IssueDto"];

/** GET /v1/clubs/:clubId/issues — §23 de la demande. */
export async function listIssues(fetcher: ApiFetcher, clubId: string): Promise<IssueDto[]> {
  const { issues } = await fetcher<{ issues: IssueDto[] }>(`/v1/clubs/${clubId}/issues`);
  return issues;
}

/** POST /v1/clubs/:clubId/issues/:matchId/resolve */
export async function resolveIssue(fetcher: ApiFetcher, clubId: string, matchId: string): Promise<{ resolved: boolean }> {
  return fetcher<{ resolved: boolean }>(`/v1/clubs/${clubId}/issues/${matchId}/resolve`, { method: "POST" });
}
