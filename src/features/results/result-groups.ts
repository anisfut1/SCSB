import type { MatchListItemDto } from "@/lib/api/matches";
import type { PoolStandingsDto } from "@/lib/api/publicMatches";
import { clubSideLabel, matchOutcome } from "@/features/matches/match-display";

export interface ResultGroup {
  /** Identifiant stable pour l'URL (`?equipe=`), dérivé du libellé. */
  key: string;
  label: string;
  competitionName: string | null;
  /** Matchs joués avec score, du plus récent au plus ancien. */
  results: MatchListItemDto[];
  /** Classements FFBB de cette équipe (une poule par phase), le plus récent d'abord. */
  standings: PoolStandingsDto[];
  record: { won: number; lost: number; draw: number };
}

export function groupKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Résultats regroupés par équipe/catégorie (retour du club, 2026-10-01 :
 * "mettre du coup les résultats qu'on a déjà, par catégorie, et même le
 * classement"). Même libellé que la liste des matchs (`clubSideLabel`) :
 * l'équipe du club si connue, sinon le club + la catégorie FFBB. Les
 * classements sont rattachés par ce même libellé d'équipe.
 */
export function buildResultGroups(matches: MatchListItemDto[], standings: PoolStandingsDto[], clubName: string, now: Date = new Date()): ResultGroup[] {
  const groups = new Map<string, ResultGroup>();
  const ensure = (label: string, competitionName: string | null): ResultGroup => {
    const key = groupKey(label) || "autres";
    let group = groups.get(key);
    if (!group) {
      group = { key, label, competitionName, results: [], standings: [], record: { won: 0, lost: 0, draw: 0 } };
      groups.set(key, group);
    }
    if (!group.competitionName && competitionName) group.competitionName = competitionName;
    return group;
  };

  const played = matches
    .filter((m) => m.scoreHome !== null && m.scoreAway !== null && m.matchDatetime !== null && new Date(m.matchDatetime) <= now)
    .sort((a, b) => new Date(b.matchDatetime!).getTime() - new Date(a.matchDatetime!).getTime());

  for (const match of played) {
    const group = ensure(clubSideLabel(match, clubName), match.competitionName ?? null);
    group.results.push(match);
    const outcome = matchOutcome(match);
    if (outcome === "win") group.record.won += 1;
    else if (outcome === "loss") group.record.lost += 1;
    else if (outcome === "draw") group.record.draw += 1;
  }

  for (const pool of standings) {
    const label = pool.teamName ?? (pool.categoryLabel ? `${clubName} · ${pool.categoryLabel}` : null);
    if (!label) continue;
    ensure(label, pool.competitionName).standings.push(pool);
  }

  for (const group of groups.values()) {
    group.standings.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }

  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label, "fr", { numeric: true }));
}

/** Ligne du club dans un classement (première trouvée). */
export function clubStandingRow(pool: PoolStandingsDto) {
  return pool.rows.find((row) => row.isClub) ?? null;
}
