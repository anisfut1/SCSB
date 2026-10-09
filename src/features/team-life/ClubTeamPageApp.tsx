"use client";

import { useCallback } from "react";
import { browserApi } from "@/lib/api/browserClient";
import { TeamPageView } from "./TeamPageView";
import type { TeamTab } from "./team-tab";

/** Page Équipe de l'espace club (tout membre ; le serveur filtre ce qui est réservé aux coachs / admins). */
export function ClubTeamPageApp({ clubId, clubSlug, teamId, timezone, tab, canManageTrainings }: { clubId: string; clubSlug: string; teamId: string; timezone: string; tab: TeamTab; canManageTrainings: boolean }) {
  const loadOverview = useCallback(() => browserApi.teamLife.teamOverview(clubId, teamId), [clubId, teamId]);
  const loadPlanning = useCallback((period: { from: string; to: string }) => browserApi.teamLife.planning(clubId, { ...period, teamId }), [clubId, teamId]);
  return (
    <TeamPageView
      tab={tab}
      basePath={`/c/${clubSlug}/equipes/${teamId}`}
      timezone={timezone}
      loadOverview={loadOverview}
      loadPlanning={loadPlanning}
      matchHref={(id) => `/c/${clubSlug}/matchs/${id}`}
      trainingHref={canManageTrainings ? (e) => `/c/${clubSlug}/entrainements?equipe=${teamId}&seance=${e.id}` : undefined}
      manageTrainingsHref={canManageTrainings ? `/c/${clubSlug}/entrainements?equipe=${teamId}` : undefined}
    />
  );
}
