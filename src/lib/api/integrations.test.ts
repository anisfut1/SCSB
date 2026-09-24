import { describe, expect, it } from "vitest";
import { getIntegrationStatus, listSyncRuns, processFbiJobs, testFbiConnection, triggerFfbbSync } from "./integrations";
import type { ApiFetcher } from "./client";

function fakeFetcher(response: unknown): { fetcher: ApiFetcher; calls: string[]; inits: unknown[] } {
  const calls: string[] = [];
  const inits: unknown[] = [];
  const fetcher: ApiFetcher = (async (path: string, init?: unknown) => {
    calls.push(path);
    inits.push(init);
    return response;
  }) as ApiFetcher;
  return { fetcher, calls, inits };
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

describe("processFbiJobs", () => {
  it("appelle POST /v1/clubs/:clubId/integrations/fbi/process-jobs et renvoie le résumé du lot", async () => {
    const { fetcher, calls } = fakeFetcher({ claimed: 2, succeeded: 1, failed: 1 });

    const result = await processFbiJobs(fetcher, "club-1");

    expect(calls).toEqual(["/v1/clubs/club-1/integrations/fbi/process-jobs"]);
    expect(result).toEqual({ claimed: 2, succeeded: 1, failed: 1 });
  });

  it("dépasse le timeout par défaut (20s) — un seul job discover_emarque prend déjà ~25-30s en pratique", async () => {
    const { fetcher, inits } = fakeFetcher({ claimed: 0, succeeded: 0, failed: 0 });

    await processFbiJobs(fetcher, "club-1");

    expect((inits[0] as { timeoutMs?: number }).timeoutMs).toBe(280_000);
  });
});
