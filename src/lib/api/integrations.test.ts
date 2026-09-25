import { describe, expect, it } from "vitest";
import { getIntegrationStatus, listSyncRuns, parseFbiDocuments, processFbiJobs, testFbiConnection, triggerCheckAllDerogations, triggerFfbbSync } from "./integrations";
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

describe("triggerCheckAllDerogations", () => {
  it("appelle POST /v1/clubs/:clubId/integrations/fbi/check-all-derogations ('je veux un bouton global qui check toutes les demandes, pas match par match')", async () => {
    const { fetcher, calls, inits } = fakeFetcher({ queued: true });

    const result = await triggerCheckAllDerogations(fetcher, "club-1");

    expect(calls).toEqual(["/v1/clubs/club-1/integrations/fbi/check-all-derogations"]);
    expect((inits[0] as { method?: string }).method).toBe("POST");
    expect(result).toEqual({ queued: true });
  });
});

describe("parseFbiDocuments", () => {
  it("appelle POST /v1/clubs/:clubId/integrations/fbi/parse-documents et renvoie le résumé du lot", async () => {
    const { fetcher, calls } = fakeFetcher({ candidatesExamined: 3, imported: 2, errors: 1 });

    const result = await parseFbiDocuments(fetcher, "club-1");

    expect(calls).toEqual(["/v1/clubs/club-1/integrations/fbi/parse-documents"]);
    expect(result).toEqual({ candidatesExamined: 3, imported: 2, errors: 1 });
  });

  it("dépasse le timeout par défaut (20s) — plusieurs documents peuvent être traités en un seul appel", async () => {
    const { fetcher, inits } = fakeFetcher({ candidatesExamined: 0, imported: 0, errors: 0 });

    await parseFbiDocuments(fetcher, "club-1");

    expect((inits[0] as { timeoutMs?: number }).timeoutMs).toBe(120_000);
  });
});
