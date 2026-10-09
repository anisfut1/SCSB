"use client";

import { useMemo } from "react";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import { MatchTeamLifePanel } from "./MatchTeamLifePanel";
import { clubTeamLifeClient, publicTeamLifeClient } from "./team-life-client";

/** Fiche match, espace club : coach de l'équipe / admin (sinon l'API répond 403 et le bloc n'apparaît pas). */
export function ClubMatchTeamLifeBlock({ clubId, matchId, timezone }: { clubId: string; matchId: string; timezone: string }) {
  const client = useMemo(() => clubTeamLifeClient(clubId), [clubId]);
  return <MatchTeamLifePanel client={client} matchId={matchId} timezone={timezone} />;
}

/** Fiche match, espace public : coach de l'équipe / admin reconnu par son lien personnel ; rien pour les autres visiteurs. */
export function PublicMatchTeamLifeBlock({ clubSlug, matchId, timezone }: { clubSlug: string; matchId: string; timezone: string }) {
  const { identity } = usePublicIdentity();
  const token = identity?.token;
  const client = useMemo(() => (token ? publicTeamLifeClient(clubSlug, token) : null), [clubSlug, token]);
  if (!client) return null;
  return <MatchTeamLifePanel key={token} client={client} matchId={matchId} timezone={timezone} />;
}
