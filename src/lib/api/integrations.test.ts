import { describe, expect, it } from "vitest";
import { getIntegrationStatus, listSyncRuns, testFbiConnection, triggerFfbbSync } from "./integrations";
import type { ApiFetcher } from "./client";

function fakeFetcher(response: unknown): { fetcher: ApiFetcher; calls: string[] } {
  const calls: string[] = [];
  const fetcher: ApiFetcher = (async (path: string) => {
    calls.push(path);
    return response;
  }) as ApiFetcher;
  return { fetcher, calls };
}

describe("listSyncRuns", () => {
  it("appelle /v1/clubs/:clubId/integrations/sync-runs (sous integrationsRouter, pas une route top-level) — régression du 404 constaté sur /admin/sync", async () => {
    const { fetcher, calls } = fakeFetcher({ syncRuns: [] });

    await listSyncRuns(fetcher, "club-1");

    expect(calls).toEqual(["/v1/clubs/club-1/integrations/sync-runs"]);
  });
});

describe("getIntegrationStatus / testFbiConnection / triggerFfbbSync", () => {
  it("appellent bien les routes sous /integrations", async () => {
    const status = fakeFetcher({});
    await getIntegrationStatus(status.fetcher, "club-1");
    expect(status.calls).toEqual(["/v1/clubs/club-1/integrations"]);

    const test = fakeFetcher({ success: true, message: "ok" });
    await testFbiConnection(test.fetcher, "club-1");
    expect(test.calls).toEqual(["/v1/clubs/club-1/integrations/fbi/test"]);

    const sync = fakeFetcher({ syncRunId: "r1", status: "success", stats: {} });
    await triggerFfbbSync(sync.fetcher, "club-1");
    expect(sync.calls).toEqual(["/v1/clubs/club-1/integrations/ffbb/sync"]);
  });
});
