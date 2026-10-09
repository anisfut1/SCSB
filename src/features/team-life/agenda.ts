import type { HomeRelation, PublicHomeDto } from "@/lib/api/publicHome";
import type { ActionCenterDto, PlanningEventDto } from "@/lib/api/teamLife";

/**
 * « Mon agenda » de l'accueil public (retour du club, 2026-10-09 : « un coach
 * verra aussi ses matchs à coacher, ses entraînements prévus, et le joueur
 * ses entraînements + ses matchs ») : les matchs de l'accueil (fiche riche)
 * + les entraînements, et les matchs des autres enfants de l'appareil, dans
 * une seule liste chronologique.
 */
export type AgendaItem =
  | { kind: "MATCH"; key: string; at: string | null; entry: PublicHomeDto["upcoming"][number] }
  | { kind: "EVENT"; key: string; at: string; event: PlanningEventDto; relations: HomeRelation[]; forFirstNames: string[] };

export function buildAgenda(home: Pick<PublicHomeDto, "upcoming">, center: Pick<ActionCenterDto, "people" | "upcoming"> | null): AgendaItem[] {
  const items: AgendaItem[] = home.upcoming.map((entry) => ({ kind: "MATCH", key: `m-${entry.match.id}`, at: entry.match.matchDatetime, entry }));
  if (center) {
    const knownMatches = new Set(home.upcoming.map((e) => e.match.id));
    for (const event of center.upcoming) {
      // Matchs déjà affichés en fiche complète (lien actif) : jamais en double.
      if (event.kind === "MATCH" && knownMatches.has(event.id)) continue;
      const teamId = event.team?.id;
      const relations: HomeRelation[] = [];
      if (teamId && center.people.some((p) => p.coachTeams.some((t) => t.id === teamId))) relations.push("COACH");
      if (teamId && center.people.some((p) => p.team?.id === teamId)) relations.push("PLAYER");
      items.push({ kind: "EVENT", key: `${event.kind}-${event.id}`, at: event.startsAt, event, relations, forFirstNames: event.forFirstNames });
    }
  }
  // Sans date (match à confirmer) : à la fin, comme avant.
  return items.sort((a, b) => (a.at && b.at ? a.at.localeCompare(b.at) : a.at ? -1 : b.at ? 1 : 0));
}
