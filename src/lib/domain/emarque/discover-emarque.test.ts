import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EMarqueMatchData } from "@/server/emarque/types";
import { FbiError } from "@/lib/fbi/provider";

vi.mock("@/lib/domain/club/club-repository", () => ({
  getClubId: vi.fn(async () => "club-1"),
}));

vi.mock("@/lib/fbi/credentials-store", () => ({
  getFbiCredentials: vi.fn(),
}));

const loginMock = vi.fn();
const findEmarqueDocumentsMock = vi.fn();
const downloadDocumentMock = vi.fn();

vi.mock("@/lib/fbi/provider", async () => {
  const actual = await vi.importActual<typeof import("@/lib/fbi/provider")>("@/lib/fbi/provider");
  class FakeFbiProvider {
    login = loginMock;
    findEmarqueDocuments = findEmarqueDocumentsMock;
    downloadDocument = downloadDocumentMock;
  }
  return {
    ...actual,
    FbiProvider: FakeFbiProvider,
  };
});

vi.mock("@/lib/storage/emarque-storage", () => ({
  emarqueStoragePath: vi.fn((season: string, matchId: string, fileName: string) => `private/emarque/${season}/${matchId}/${fileName}`),
  uploadEmarqueFile: vi.fn(async () => undefined),
}));

vi.mock("@/server/emarque/parser/parse-emarque-zip", () => ({
  PARSER_VERSION: "test-version",
  parseEmarqueZip: vi.fn(),
}));

vi.mock("@/server/emarque/persist/persist-emarque-match", () => ({
  persistEmarqueMatchData: vi.fn(async () => ({ importId: "import-1", status: "imported", alreadyImported: false, participantsLinked: 0, participantsUnlinked: 0 })),
}));

import { getFbiCredentials } from "@/lib/fbi/credentials-store";
import { uploadEmarqueFile } from "@/lib/storage/emarque-storage";
import { parseEmarqueZip } from "@/server/emarque/parser/parse-emarque-zip";
import { persistEmarqueMatchData } from "@/server/emarque/persist/persist-emarque-match";
import { discoverEmarque } from "./discover-emarque";

const EMPTY_EMARQUE_DATA: EMarqueMatchData = {
  match: {
    rencontreNumero: "2813",
    competitionLabel: null,
    pouleLabel: null,
    date: null,
    heure: null,
    lieu: null,
    homeTeamName: null,
    awayTeamName: null,
    homeClubCode: null,
    awayClubCode: null,
    scoreHome: 69,
    scoreAway: 101,
    scoreByPeriod: [],
  },
  players: [],
  coaches: [],
  officials: [],
  tableOfficials: [],
  playerStats: [],
  shotData: { experimental: true, documentPresent: false },
  quality: { warnings: [], overallConfidence: null },
};

interface FakeMatchCandidate {
  id: string;
  numero: string | null;
  match_datetime: string | null;
  score_home: number | null;
  score_away: number | null;
  emarque_discovery_attempt_count: number;
}

function makeFakeSupabase(candidates: FakeMatchCandidate[], recorders: { matchUpdates: Array<{ patch: unknown; id: string }>; statusUpserts: unknown[] }) {
  return {
    from(table: string) {
      if (table === "matches") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                or: () => Promise.resolve({ data: candidates, error: null }),
              }),
            }),
          }),
          update: (patch: unknown) => ({
            eq: (_col: string, id: string) => {
              recorders.matchUpdates.push({ patch, id });
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
      throw new Error(`Table inattendue dans le fake Supabase de test : ${table}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const A_CANDIDATE: FakeMatchCandidate = {
  id: "match-1",
  numero: "2813",
  match_datetime: "2025-09-27T19:00:00.000Z",
  score_home: null,
  score_away: null,
  emarque_discovery_attempt_count: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("discoverEmarque", () => {
  it("ne fait rien et ne tente pas de connexion FBI quand aucun match n'est candidat", async () => {
    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([], recorders);

    const result = await discoverEmarque(supabase);

    expect(result).toEqual({
      candidatesExamined: 0,
      imported: 0,
      stillWaiting: 0,
      errors: 0,
      skippedNoCredentials: false,
      skippedLoginFailed: false,
    });
    expect(getFbiCredentials).not.toHaveBeenCalled();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("ignore la découverte quand aucun identifiant FBI n'est enregistré", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue(null);
    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([A_CANDIDATE], recorders);

    const result = await discoverEmarque(supabase);

    expect(result.skippedNoCredentials).toBe(true);
    expect(result.candidatesExamined).toBe(1);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("interrompt le job proprement quand la connexion FBI échoue (identifiants invalides)", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue({ username: "clubxxxx", password: "wrong" });
    loginMock.mockRejectedValue(new FbiError("Connexion FBI refusée", "LOGIN_FAILED"));

    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([A_CANDIDATE], recorders);

    const result = await discoverEmarque(supabase);

    expect(result.skippedLoginFailed).toBe(true);
    expect(findEmarqueDocumentsMock).not.toHaveBeenCalled();
    expect(recorders.statusUpserts).toContainEqual(
      expect.objectContaining({ last_login_success: false, last_job_status: "error" }),
    );
  });

  it("planifie une nouvelle tentative (waiting_for_emarque) quand l'endpoint de découverte n'est pas confirmé", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ cookieJar: {} });
    findEmarqueDocumentsMock.mockRejectedValue(
      new FbiError("Endpoint non confirmé", "EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED"),
    );

    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([A_CANDIDATE], recorders);

    const result = await discoverEmarque(supabase);

    expect(result.errors).toBe(1);
    expect(result.imported).toBe(0);
    expect(recorders.matchUpdates).toHaveLength(1);
    expect(recorders.matchUpdates[0]).toMatchObject({
      id: "match-1",
      patch: expect.objectContaining({ emarque_status: "waiting_for_emarque", emarque_discovery_attempt_count: 1 }),
    });
  });

  it("augmente le compteur de tentatives à chaque nouvel échec (retry/backoff progressif)", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ cookieJar: {} });
    findEmarqueDocumentsMock.mockRejectedValue(
      new FbiError("Endpoint non confirmé", "EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED"),
    );

    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([{ ...A_CANDIDATE, emarque_discovery_attempt_count: 3 }], recorders);

    await discoverEmarque(supabase);

    expect(recorders.matchUpdates[0]).toMatchObject({
      patch: expect.objectContaining({ emarque_discovery_attempt_count: 4 }),
    });
  });

  it("télécharge, parse et persiste un document trouvé (cas nominal, une fois l'endpoint disponible)", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ cookieJar: {} });
    findEmarqueDocumentsMock.mockResolvedValue([{ url: "https://fbi.test/export/2813.zip", fileName: "2813.zip" }]);
    downloadDocumentMock.mockResolvedValue(Buffer.from("contenu-zip-synthetique"));
    vi.mocked(parseEmarqueZip).mockResolvedValue(EMPTY_EMARQUE_DATA);

    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([A_CANDIDATE], recorders);

    const result = await discoverEmarque(supabase);

    expect(result.imported).toBe(1);
    expect(result.errors).toBe(0);
    expect(uploadEmarqueFile).toHaveBeenCalledWith(
      "private/emarque/2025-2026/match-1/original.zip",
      expect.any(Buffer),
      "application/zip",
    );
    expect(persistEmarqueMatchData).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        matchId: "match-1",
        clubId: "club-1",
        sourceFileName: "2813.zip",
        parserVersion: "test-version",
        data: EMPTY_EMARQUE_DATA,
      }),
    );
    // Le hash SHA-256 est calculé à partir du contenu réel du buffer téléchargé.
    const persistCallArgs = vi.mocked(persistEmarqueMatchData).mock.calls[0]?.[1];
    expect(persistCallArgs?.fileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("passe au match suivant sans planter le job quand un match n'a pas de numéro de rencontre", async () => {
    vi.mocked(getFbiCredentials).mockResolvedValue({ username: "clubxxxx", password: "correct" });
    loginMock.mockResolvedValue({ cookieJar: {} });

    const recorders = { matchUpdates: [], statusUpserts: [] };
    const supabase = makeFakeSupabase([{ ...A_CANDIDATE, numero: null }], recorders);

    const result = await discoverEmarque(supabase);

    expect(result.stillWaiting).toBe(1);
    expect(findEmarqueDocumentsMock).not.toHaveBeenCalled();
  });
});
