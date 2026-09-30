import type { MatchListItemDto } from "@/lib/api/matches";
import type { TeamDto } from "@/lib/api/clubs";

/**
 * Filtres de la liste des matchs, partagés entre la vue club
 * (`/c/{slug}/matchs`) et la vue publique (`/public/{slug}/matchs`) —
 * logique inchangée, seulement dédupliquée (elle était copiée dans les deux
 * pages). L'état vit dans l'URL : partageable, compatible retour arrière.
 */
export type WhenFilter = "weekend" | "upcoming" | "past";
export type SideFilter = "all" | "home" | "away";

export interface MatchFiltersState {
  when: WhenFilter;
  side: SideFilter;
  team: string | null;
}

export const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: "weekend", label: "Ce week-end" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
];

export const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "Tous les lieux" },
  { value: "home", label: "Domicile" },
  { value: "away", label: "Extérieur" },
];

export function parseMatchFilters(searchParams: Record<string, string | string[] | undefined>): MatchFiltersState {
  const when: WhenFilter = searchParams.when === "upcoming" || searchParams.when === "past" ? searchParams.when : "weekend";
  const side: SideFilter = searchParams.side === "home" || searchParams.side === "away" ? searchParams.side : "all";
  const team = typeof searchParams.team === "string" ? searchParams.team : null;
  return { when, side, team };
}

/** Samedi 00:00 -> lundi 00:00 de la semaine courante (Europe/Paris implicite : dates stockées en UTC, affichées en heure locale). */
export function currentWeekendRange(now: Date = new Date()): { start: Date; end: Date } {
  const day = now.getDay(); // 0 = dimanche ... 6 = samedi
  const daysUntilSaturday = (6 - day) % 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysUntilSaturday);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { start, end };
}

export function buildFilterHref(basePath: string, current: MatchFiltersState, changes: Partial<MatchFiltersState>): string {
  const next = { ...current, ...changes };
  const search = new URLSearchParams();
  if (next.when !== "weekend") search.set("when", next.when);
  if (next.side !== "all") search.set("side", next.side);
  if (next.team) search.set("team", next.team);
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function applyMatchFilters(all: MatchListItemDto[], teams: TeamDto[], filters: MatchFiltersState, now: Date = new Date()): MatchListItemDto[] {
  let matches = all;
  if (filters.team) {
    const teamName = teams.find((t) => t.id === filters.team)?.name ?? null;
    matches = teamName ? matches.filter((m) => m.teamName === teamName) : matches;
  }
  if (filters.side !== "all") matches = matches.filter((m) => m.isHome === (filters.side === "home"));

  if (filters.when === "weekend") {
    const { start, end } = currentWeekendRange(now);
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) >= start && new Date(m.matchDatetime) < end);
  } else if (filters.when === "upcoming") {
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) >= now);
  } else {
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) < now);
  }

  return [...matches].sort((a, b) => {
    const aTime = a.matchDatetime ? new Date(a.matchDatetime).getTime() : 0;
    const bTime = b.matchDatetime ? new Date(b.matchDatetime).getTime() : 0;
    return filters.when === "past" ? bTime - aTime : aTime - bTime;
  });
}
