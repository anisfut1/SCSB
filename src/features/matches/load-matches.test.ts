import { describe, expect, it, vi } from "vitest";
import type { TeamDto } from "@/lib/api/clubs";
import { listMatches, type ListMatchesParams, type MatchListItemDto } from "@/lib/api/matches";
import type { ApiFetcher } from "@/lib/api/client";
import { applyMatchFilters, type MatchFiltersState } from "./match-filters";
import { buildServerMatchQuery, loadMatchesForView } from "./load-matches";

/**
 * LOT-06 (TRT-006) : filtres de la liste des matchs déportés vers l'API.
 *
 * Jeu de données SYNTHÉTIQUE et déterministe (aucune donnée réelle) : 15
 * équipes × 26 matchs = 390 matchs, saison démarrée le 1er août 2026, « maintenant »
 * figé au 7 octobre 2026. Le faux serveur applique la sémantique supposée de
 * l'API (`from` inclus, `to` exclu, `teamId`, `homeAway`, tri croissant,
 * `limit`/`offset`) — sémantique à confirmer (Q-014). Les tailles en octets
 * sont celles du JSON des réponses simulées : des ESTIMATIONS, pas des mesures
 * de production.
 */

const NOW = new Date("2026-10-07T12:00:00.000Z");
const SEASON_START = new Date("2026-08-01T00:00:00.000Z");
const TEAM_COUNT = 15;
const GAMES = 26;

function team(index: number): TeamDto {
  const n = String(index).padStart(2, "0");
  return { id: `t-${n}`, name: `Équipe ${n}` } as TeamDto;
}
const TEAMS = Array.from({ length: TEAM_COUNT }, (_, i) => team(i + 1));

function buildSeason(): MatchListItemDto[] {
  const firstSaturday = Date.UTC(2026, 8, 5, 14, 0, 0); // samedi 5 septembre 2026
  const out: MatchListItemDto[] = [];
  for (let t = 1; t <= TEAM_COUNT; t++) {
    for (let k = 0; k < GAMES; k++) {
      // Sam./dim. selon l'équipe, un match en semaine de temps en temps (rattaché à la journée suivante).
      const dayOffset = k % 7 === 3 ? 4 : t % 2;
      const at = new Date(firstSaturday + k * 7 * 86_400_000 + dayOffset * 86_400_000 + (t % 5) * 3_600_000);
      const played = at < NOW;
      const n = String(t).padStart(2, "0");
      out.push({
        id: `00000000-0000-4000-8000-${String(t * 100 + k).padStart(12, "0")}`,
        numero: String(1000 + t * 100 + k),
        journee: String(k + 1),
        matchDatetime: at.toISOString(),
        isHome: (k + t) % 2 === 0,
        teamName: `Équipe ${n}`,
        competitionName: "Championnat régional jeunes - poule A",
        categoryLabel: "U15 M",
        opponentName: `Adversaire ${k + 1}`,
        opponentLogoUrl: `https://cdn.example.test/logos/${t}-${k}.png`,
        venueLabel: "GYMNASE EXEMPLE",
        scoreHome: played ? 60 + ((t + k) % 20) : null,
        scoreAway: played ? 55 + ((t * k) % 20) : null,
        status: played ? "played" : "scheduled",
        emarqueStatus: played ? "published" : "not_applicable",
        derogationStatus: null,
      } as MatchListItemDto);
    }
  }
  return out;
}
const SEASON = buildSeason();

function fakeServer(toInclusive = false) {
  const stats = { requests: 0, bytes: 0, paths: [] as string[] };
  const fetcher = (async (path: string) => {
    stats.requests += 1;
    stats.paths.push(path);
    const url = new URL(path, "http://api.test");
    const q = url.searchParams;
    const from = q.get("from");
    const to = q.get("to");
    let rows = SEASON.filter((m) => {
      const t = m.matchDatetime!;
      if (from && t < from) return false;
      if (to && (toInclusive ? t > to : t >= to)) return false;
      if (q.get("teamId") && m.teamName !== `Équipe ${q.get("teamId")!.slice(2)}`) return false;
      if (q.get("homeAway") && m.isHome !== (q.get("homeAway") === "home")) return false;
      return true;
    }).sort((a, b) => a.matchDatetime!.localeCompare(b.matchDatetime!) || a.id.localeCompare(b.id));
    const limit = Number(q.get("limit") ?? 50);
    const offset = Number(q.get("offset") ?? 0);
    const total = rows.length;
    rows = rows.slice(offset, offset + limit);
    const body = { matches: rows, pagination: { limit, offset, total } };
    stats.bytes += JSON.stringify(body).length;
    return body;
  }) as ApiFetcher;
  return { fetcher, stats };
}

const SCENARIOS: { name: string; filters: MatchFiltersState }[] = [
  { name: "Journée (vue par défaut)", filters: { when: "weekend", side: "all", team: null, weekend: null } },
  { name: "Journée + équipe 03", filters: { when: "weekend", side: "all", team: "t-03", weekend: null } },
  { name: "À venir", filters: { when: "upcoming", side: "all", team: null, weekend: null } },
  { name: "À venir + domicile", filters: { when: "upcoming", side: "home", team: null, weekend: null } },
  { name: "Passés", filters: { when: "past", side: "all", team: null, weekend: null } },
  { name: "Passés + équipe 07", filters: { when: "past", side: "all", team: "t-07", weekend: null } },
  { name: "À venir + équipe 12 + extérieur", filters: { when: "upcoming", side: "away", team: "t-12", weekend: null } },
];

async function legacy(filters: MatchFiltersState, toInclusive = false) {
  const server = fakeServer(toInclusive);
  const { matches } = await loadMatchesForView({
    serverFilters: false,
    filters,
    seasonStart: SEASON_START,
    now: NOW,
    fetchTeams: async () => TEAMS,
    fetchMatches: (params) => listMatches(server.fetcher, "club-1", params),
  });
  return { shown: applyMatchFilters(matches, TEAMS, filters, NOW), ...server };
}

async function serverSide(filters: MatchFiltersState, toInclusive = false) {
  const server = fakeServer(toInclusive);
  const { matches } = await loadMatchesForView({
    serverFilters: true,
    filters,
    seasonStart: SEASON_START,
    now: NOW,
    fetchTeams: async () => TEAMS,
    fetchMatches: (params) => listMatches(server.fetcher, "club-1", params),
  });
  return { shown: applyMatchFilters(matches, TEAMS, filters, NOW), ...server };
}

describe("caractérisation du filtrage local actuel (ancien comportement, flag désactivé)", () => {
  it("fige le nombre de matchs affichés par scénario sur le jeu synthétique", async () => {
    expect(SEASON).toHaveLength(390);
    const counts: Record<string, number> = {};
    for (const s of SCENARIOS) counts[s.name] = (await legacy(s.filters)).shown.length;

    // Valeurs relevées sur le code d'origine AVANT le LOT-06 ; elles ne doivent plus bouger.
    expect(counts).toEqual({
      "Journée (vue par défaut)": 15,
      "Journée + équipe 03": 1,
      "À venir": 315,
      "À venir + domicile": 158,
      "Passés": 75,
      "Passés + équipe 07": 5,
      "À venir + équipe 12 + extérieur": 11,
    });
  });

  it("flag désactivé : une seule requête de filtre (la saison), paginée par 200, aucun filtre serveur", async () => {
    const { stats } = await legacy(SCENARIOS[3]!.filters);

    expect(stats.requests).toBe(2); // 390 matchs → 2 pages de 200
    for (const path of stats.paths) {
      const q = new URL(path, "http://x").searchParams;
      expect(q.get("teamId")).toBeNull();
      expect(q.get("homeAway")).toBeNull();
      expect(q.get("to")).toBeNull();
      expect(q.get("from")).toBe(SEASON_START.toISOString());
    }
  });
});

describe("parité : le filtrage serveur affiche exactement les mêmes matchs", () => {
  for (const toInclusive of [false, true]) {
    for (const s of SCENARIOS) {
      it(`${s.name} (borne \`to\` ${toInclusive ? "incluse" : "exclue"})`, async () => {
        const before = await legacy(s.filters, toInclusive);
        const after = await serverSide(s.filters, toInclusive);

        expect(after.shown.map((m) => m.id)).toEqual(before.shown.map((m) => m.id));
      });
    }
  }
});

describe("buildServerMatchQuery", () => {
  it("n'utilise jamais `period` (sémantique non confirmée, Q-014) et garde from/to pour la période", () => {
    for (const s of SCENARIOS) {
      const query = buildServerMatchQuery(s.filters, TEAMS, SEASON_START, NOW);
      expect(query).not.toHaveProperty("period");
    }
    expect(buildServerMatchQuery(SCENARIOS[2]!.filters, TEAMS, SEASON_START, NOW)).toEqual({ from: NOW.toISOString() });
    expect(buildServerMatchQuery(SCENARIOS[4]!.filters, TEAMS, SEASON_START, NOW)).toEqual({ from: SEASON_START.toISOString(), to: NOW.toISOString() });
  });

  it("mode Journée : toute la saison (le sélecteur de journée en a besoin), seuls équipe et lieu partent au serveur", () => {
    expect(buildServerMatchQuery({ when: "weekend", side: "home", team: "t-03", weekend: null }, TEAMS, SEASON_START, NOW)).toEqual({
      from: SEASON_START.toISOString(),
      teamId: "t-03",
      homeAway: "home",
    });
  });

  it("un identifiant d'équipe inconnu (URL bricolée) n'est jamais transmis à l'API", () => {
    const query = buildServerMatchQuery({ when: "upcoming", side: "all", team: "pas-une-equipe", weekend: null }, TEAMS, SEASON_START, NOW);

    expect(query).toEqual({ from: NOW.toISOString() });
  });
});

describe("loadMatchesForView : appels réseau", () => {
  it("flag activé sans équipe : équipes et matchs en parallèle (aucun aller-retour de plus)", async () => {
    const order: string[] = [];
    await loadMatchesForView({
      serverFilters: true,
      filters: SCENARIOS[2]!.filters,
      seasonStart: SEASON_START,
      now: NOW,
      fetchTeams: async () => {
        order.push("teams:start");
        await Promise.resolve();
        order.push("teams:end");
        return TEAMS;
      },
      fetchMatches: async () => {
        order.push("matches:start");
        return [];
      },
    });

    expect(order.slice(0, 2)).toEqual(["teams:start", "matches:start"]);
  });

  it("flag activé avec équipe : les équipes d'abord (validation de l'id), puis les matchs filtrés", async () => {
    const fetchMatches = vi.fn<(params: ListMatchesParams) => Promise<MatchListItemDto[]>>(async () => []);
    const fetchTeams = vi.fn(async () => TEAMS);

    await loadMatchesForView({ serverFilters: true, filters: SCENARIOS[1]!.filters, seasonStart: SEASON_START, now: NOW, fetchTeams, fetchMatches });

    expect(fetchTeams).toHaveBeenCalledBefore(fetchMatches);
    expect(fetchMatches).toHaveBeenCalledWith({ from: SEASON_START.toISOString(), teamId: "t-03" });
  });
});

describe("mesure simulée : requêtes et volume par changement de filtre (jeu synthétique, estimations)", () => {
  it("le filtrage serveur ne télécharge jamais plus que l'ancien comportement, et beaucoup moins hors vue « Journée » sans filtre", async () => {
    const rows: string[] = [];
    for (const s of SCENARIOS) {
      const before = await legacy(s.filters);
      const after = await serverSide(s.filters);
      rows.push(`${s.name} | avant ${before.stats.requests} req ${before.stats.bytes} o | après ${after.stats.requests} req ${after.stats.bytes} o`);

      expect(after.stats.requests).toBeLessThanOrEqual(before.stats.requests);
      expect(after.stats.bytes).toBeLessThanOrEqual(before.stats.bytes);
    }
    console.info(["MESURE_SIMULEE", ...rows].join("\n"));

    const byName = Object.fromEntries(SCENARIOS.map((s, i) => [s.name, i]));
    const past = await serverSide(SCENARIOS[byName["Passés"]!]!.filters);
    const pastBefore = await legacy(SCENARIOS[byName["Passés"]!]!.filters);
    expect(past.stats.bytes).toBeLessThan(pastBefore.stats.bytes / 3);

    // Vue par défaut (Journée, sans filtre) : AUCUN gain tant que /matches/weekends n'existe pas (04 §B.3).
    const defBefore = await legacy(SCENARIOS[0]!.filters);
    const defAfter = await serverSide(SCENARIOS[0]!.filters);
    expect(defAfter.stats.bytes).toBe(defBefore.stats.bytes);
  });
});
