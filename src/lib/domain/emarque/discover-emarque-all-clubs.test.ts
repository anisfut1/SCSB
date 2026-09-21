import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fbi/credentials-store", () => ({ getFbiCredentials: vi.fn(async () => null) }));
vi.mock("@/lib/fbi/provider", async () => {
  const actual = await vi.importActual<typeof import("@/lib/fbi/provider")>("@/lib/fbi/provider");
  return { ...actual, FbiProvider: vi.fn() };
});

import { discoverEmarqueForAllClubs } from "./discover-emarque";

interface FakeState {
  configuredClubIds: string[];
  activeClubIds: string[];
  locksHeld: Set<string>;
  acquireCalls: { clubId: string; integration: string }[];
  releaseCalls: { clubId: string; integration: string }[];
  processedClubs: string[];
}

/**
 * Fake Supabase où `discoverEmarqueForClub` (appelée en interne pour
 * chaque club) est simulée simplement : aucun match candidat, donc chaque
 * club "traité" retourne immédiatement un résultat vide sans toucher aux
 * autres. Ce test vérifie l'ORCHESTRATION multi-club (sélection des clubs,
 * verrouillage, isolation), pas la logique par-club déjà testée dans
 * discover-emarque.test.ts.
 */
function buildFakeSupabase(state: FakeState) {
  return {
    from(table: string) {
      if (table === "fbi_integration_status") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: state.configuredClubIds.map((id) => ({ club_id: id })), error: null }),
          }),
          upsert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "clubs") {
        return {
          select: () => ({
            eq: () => ({
              in: (_col: string, ids: string[]) => Promise.resolve({ data: ids.filter((id) => state.activeClubIds.includes(id)).map((id) => ({ id })), error: null }),
            }),
          }),
        };
      }
      if (table === "matches") {
        state.processedClubs.push("matches-queried");
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  or: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Table inattendue : ${table}`);
    },
    rpc(fn: string, args: { p_club_id: string; p_integration: string }) {
      if (fn === "try_acquire_sync_lock") {
        state.acquireCalls.push({ clubId: args.p_club_id, integration: args.p_integration });
        const key = `${args.p_club_id}:${args.p_integration}`;
        if (state.locksHeld.has(key)) return Promise.resolve({ data: false, error: null });
        state.locksHeld.add(key);
        return Promise.resolve({ data: true, error: null });
      }
      if (fn === "release_sync_lock") {
        state.releaseCalls.push({ clubId: args.p_club_id, integration: args.p_integration });
        state.locksHeld.delete(`${args.p_club_id}:${args.p_integration}`);
        return Promise.resolve({ data: null, error: null });
      }
      throw new Error(`RPC inattendue : ${fn}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("discoverEmarqueForAllClubs", () => {
  it("ne traite que les clubs actifs avec FBI configuré, chacun avec son propre verrou", async () => {
    const state: FakeState = {
      configuredClubIds: ["club-a", "club-b"],
      activeClubIds: ["club-a", "club-b"],
      locksHeld: new Set(),
      acquireCalls: [],
      releaseCalls: [],
      processedClubs: [],
    };
    const supabase = buildFakeSupabase(state);

    const result = await discoverEmarqueForAllClubs(supabase);

    expect(result.clubsProcessed).toBe(2);
    expect(result.clubsSkippedLocked).toBe(0);
    expect(Object.keys(result.perClub).sort()).toEqual(["club-a", "club-b"]);
    // Chaque club a son propre cycle verrou/déverrouillage — jamais partagé.
    expect(state.acquireCalls).toEqual([
      { clubId: "club-a", integration: "fbi" },
      { clubId: "club-b", integration: "fbi" },
    ]);
    expect(state.releaseCalls).toEqual([
      { clubId: "club-a", integration: "fbi" },
      { clubId: "club-b", integration: "fbi" },
    ]);
  });

  it("ignore un club déjà verrouillé (sync en cours) sans affecter les autres clubs", async () => {
    const state: FakeState = {
      configuredClubIds: ["club-a", "club-b"],
      activeClubIds: ["club-a", "club-b"],
      locksHeld: new Set(["club-a:fbi"]), // déjà pris par un autre run
      acquireCalls: [],
      releaseCalls: [],
      processedClubs: [],
    };
    const supabase = buildFakeSupabase(state);

    const result = await discoverEmarqueForAllClubs(supabase);

    expect(result.clubsSkippedLocked).toBe(1);
    expect(result.clubsProcessed).toBe(1);
    expect(result.perClub["club-b"]).toBeDefined();
    expect(result.perClub["club-a"]).toBeUndefined();
    // Le verrou pré-existant du club A n'est jamais libéré par ce run (pas le sien).
    expect(state.releaseCalls.some((c) => c.clubId === "club-a")).toBe(false);
  });

  it("ignore un club configuré FBI mais suspendu (status != active)", async () => {
    const state: FakeState = {
      configuredClubIds: ["club-a", "club-b"],
      activeClubIds: ["club-a"], // club-b suspendu
      locksHeld: new Set(),
      acquireCalls: [],
      releaseCalls: [],
      processedClubs: [],
    };
    const supabase = buildFakeSupabase(state);

    const result = await discoverEmarqueForAllClubs(supabase);

    expect(result.clubsProcessed).toBe(1);
    expect(result.perClub["club-b"]).toBeUndefined();
  });

  it("ne fait rien si aucun club n'a FBI configuré", async () => {
    const state: FakeState = {
      configuredClubIds: [],
      activeClubIds: [],
      locksHeld: new Set(),
      acquireCalls: [],
      releaseCalls: [],
      processedClubs: [],
    };
    const supabase = buildFakeSupabase(state);

    const result = await discoverEmarqueForAllClubs(supabase);

    expect(result).toEqual({ clubsProcessed: 0, clubsSkippedLocked: 0, perClub: {} });
    expect(state.acquireCalls).toHaveLength(0);
  });
});
