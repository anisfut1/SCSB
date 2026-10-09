"use client";

import { useCallback, useMemo } from "react";
import { browserApi } from "@/lib/api/browserClient";
import { TeamTrainingsManager } from "./TeamTrainingsManager";
import { clubTeamLifeClient } from "./team-life-client";

/** Entraînements — espace club (compte : admin, coach). */
export function ClubTrainingsApp({ clubId, timezone, teams, initialTeamId, initialOccurrenceId }: { clubId: string; timezone: string; teams: { id: string; name: string }[]; initialTeamId?: string | null; initialOccurrenceId?: string | null }) {
  const client = useMemo(() => clubTeamLifeClient(clubId), [clubId]);
  // Gymnases du club : même source que les dérogations (ouverte aux coachs) ; sinon saisie libre.
  const loadVenues = useCallback(() => browserApi.derogationRequests.context(clubId).then((c) => c.venues.map((v) => ({ id: v.id, name: v.name }))), [clubId]);
  return <TeamTrainingsManager client={client} teams={teams} timezone={timezone} loadVenues={loadVenues} initialTeamId={initialTeamId} initialOccurrenceId={initialOccurrenceId} />;
}
