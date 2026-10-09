"use client";

import { useCallback } from "react";
import { browserApi } from "@/lib/api/browserClient";
import { PlanningView } from "./PlanningView";

/** Planning de l'espace club : toutes les équipes (filtre par équipe), matchs + entraînements. */
export function ClubPlanningApp({ clubId, clubSlug, timezone, teams, canManage }: { clubId: string; clubSlug: string; timezone: string; teams: { id: string; name: string }[]; canManage: boolean }) {
  const load = useCallback((period: { from: string; to: string; teamId?: string }) => browserApi.teamLife.planning(clubId, period), [clubId]);
  return (
    <PlanningView
      timezone={timezone}
      load={load}
      teams={teams}
      matchHref={(id) => `/c/${clubSlug}/matchs/${id}`}
      trainingHref={canManage ? (e) => (e.team ? `/c/${clubSlug}/entrainements?equipe=${e.team.id}&seance=${e.id}` : null) : undefined}
    />
  );
}
