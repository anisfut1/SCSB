import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FbiJobRow } from "../src/db-types.js";
import type { WorkerConfig } from "../src/config.js";
import { FbiError } from "../src/fbi/errors.js";

const loginMock = vi.fn();
const findEmarqueDocumentsMock = vi.fn();
const downloadDocumentMock = vi.fn();
const closeSessionMock = vi.fn();

vi.mock("../src/fbi/browser-client.js", () => ({
  BrowserFbiClient: class FakeBrowserFbiClient {
    login = loginMock;
    findEmarqueDocuments = findEmarqueDocumentsMock;
    downloadDocument = downloadDocumentMock;
    closeSession = closeSessionMock;
  },
}));

const getFbiCredentialsMock = vi.fn();
vi.mock("../src/credentials.js", () => ({ getFbiCredentials: getFbiCredentialsMock }));

const uploadEmarqueFileMock = vi.fn();
vi.mock("../src/storage.js", async () => {
  const actual = await vi.importActual<typeof import("../src/storage.js")>("../src/storage.js");
  return { ...actual, uploadEmarqueFile: uploadEmarqueFileMock };
});

const { processDiscoverEmarqueJob } = await import("../src/jobs/process-discover-emarque.js");

const CONFIG = { fbiEncryptionKey: Buffer.alloc(32), fbiBaseUrl: "https://fbi.test.local/fbi" } as WorkerConfig;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FAKE_BROWSER = {} as any;

function baseJob(overrides: Partial<FbiJobRow> = {}): FbiJobRow {
  return {
    id: "job-1",
    club_id: "club-1",
    match_id: "match-1",
    type: "discover_emarque",
    status: "claimed",
    attempt_count: 1,
    max_attempts: 6,
    scheduled_at: "2026-01-01T00:00:00.000Z",
    claimed_at: "2026-01-01T00:00:00.000Z",
    claimed_by: "worker-1#0",
    started_at: null,
    finished_at: null,
    last_error: null,
    result: null,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

interface Recorders {
  matchUpdates: Array<{ id: string; patch: unknown }>;
  jobUpdates: Array<{ id: string; patch: unknown }>;
  documentInserts: Array<Record<string, unknown>>;
  statusUpserts: unknown[];
}

function makeFakeSupabase(options: { match: { id: string; club_id: string; numero: string | null; match_datetime: string | null } | null; recorders: Recorders; documentInsertConflict?: boolean }) {
  const { match, recorders } = options;

  return {
    from(table: string) {
      if (table === "matches") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve(match ? { data: match, error: null } : { data: null, error: { message: "introuvable" } }),
            }),
          }),
          update: (patch: unknown) => ({
            eq: (_col: string, id: string) => {
              recorders.matchUpdates.push({ id, patch });
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === "fbi_jobs") {
        return {
          update: (patch: unknown) => ({
            eq: (_col: string, id: string) => {
              recorders.jobUpdates.push({ id, patch });
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === "fbi_integration_status") {
        return {
          upsert: (payload: unknown) => {
            recorders.statusUpserts.push(payload);
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "match_documents") {
        return {
          insert: (row: Record<string, unknown>) => {
            if (options.documentInsertConflict) {
              return Promise.resolve({ error: { code: "23505", message: "duplicate" } });
            }
            recorders.documentInserts.push(row);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Table inattendue dans le fake Supabase de test : ${table}`);
    },
    storage: { from: () => ({ upload: () => Promise.resolve({ error: null }) }) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processDiscoverEmarqueJob", () => {
  it("télécharge le ZIP prioritairement, dépose une ligne match_documents et marque le job réussi", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ context: {}, page: {} });
    findEmarqueDocumentsMock.mockResolvedValue([
      { url: "https://fbi.test/export/2813.zip", fileName: "2813.zip" },
      { url: "https://fbi.test/export/2813-feuille.pdf", fileName: "2813-feuille.pdf" },
    ]);
    downloadDocumentMock.mockResolvedValue(Buffer.from("contenu-zip-synthetique"));

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: "2025-09-27T19:00:00.000Z" }, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob());

    // Priorité absolue au ZIP (§19) : le PDF séparé n'est PAS téléchargé quand un ZIP existe.
    expect(downloadDocumentMock).toHaveBeenCalledTimes(1);
    expect(recorders.documentInserts).toHaveLength(1);
    expect(recorders.documentInserts[0]).toMatchObject({ club_id: "club-1", match_id: "match-1", type: "emarque_zip", status: "downloaded" });
    expect(recorders.jobUpdates.at(-1)).toMatchObject({ id: "job-1", patch: expect.objectContaining({ status: "succeeded" }) });
    expect(recorders.matchUpdates.map((u) => (u.patch as { emarque_status: string }).emarque_status)).toEqual(["downloading", "downloaded"]);
    expect(closeSessionMock).toHaveBeenCalledOnce();
  });

  it("replanifie (jamais un échec) quand aucun document n'est encore disponible — §27 du brief FBI", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ context: {}, page: {} });
    findEmarqueDocumentsMock.mockResolvedValue([]);

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: null }, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob());

    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "pending" }) });
    expect(recorders.matchUpdates).toContainEqual({ id: "match-1", patch: { emarque_status: "waiting_for_emarque" } });
  });

  it("marque le job en échec (jamais de retry) sur des identifiants invalides — §15 du brief FBI", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "mauvais" });
    loginMock.mockRejectedValue(new FbiError("refusé", "LOGIN_FAILED"));

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: null }, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob());

    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "failed" }) });
    expect(findEmarqueDocumentsMock).not.toHaveBeenCalled();
  });

  it("replanifie une panne transitoire (FBI injoignable) tant que max_attempts n'est pas atteint", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockRejectedValue(new FbiError("injoignable", "LOGIN_PAGE_UNREACHABLE"));

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: null }, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob({ attempt_count: 2, max_attempts: 6 }));

    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "pending" }) });
  });

  it("abandonne (status failed) une panne transitoire au-delà de max_attempts", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockRejectedValue(new FbiError("injoignable", "LOGIN_PAGE_UNREACHABLE"));

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: null }, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob({ attempt_count: 6, max_attempts: 6 }));

    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "failed" }) });
  });

  it("ne re-crée pas de ligne en doublon quand match_documents a déjà cette ligne (idempotence sha256, §24)", async () => {
    getFbiCredentialsMock.mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ context: {}, page: {} });
    findEmarqueDocumentsMock.mockResolvedValue([{ url: "https://fbi.test/export/2813.zip", fileName: "2813.zip" }]);
    downloadDocumentMock.mockResolvedValue(Buffer.from("contenu-zip-synthetique"));

    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: { id: "match-1", club_id: "club-1", numero: "2813", match_datetime: null }, recorders, documentInsertConflict: true });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob());

    // Le conflit d'unicité n'est jamais traité comme une erreur de job.
    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "succeeded" }) });
  });

  it("échoue proprement (jamais de crash) quand le job n'a pas de match_id", async () => {
    const recorders: Recorders = { matchUpdates: [], jobUpdates: [], documentInserts: [], statusUpserts: [] };
    const supabase = makeFakeSupabase({ match: null, recorders });

    await processDiscoverEmarqueJob(supabase, CONFIG, FAKE_BROWSER, baseJob({ match_id: null }));

    expect(recorders.jobUpdates.at(-1)).toMatchObject({ patch: expect.objectContaining({ status: "failed" }) });
    expect(getFbiCredentialsMock).not.toHaveBeenCalled();
  });
});
