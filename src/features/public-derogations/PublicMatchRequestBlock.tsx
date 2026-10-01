"use client";

import { useEffect, useMemo, useState } from "react";
import { derogationClient, type DerogationSource } from "@/features/derogation-requests/client";
import { MatchRequestCard } from "@/features/derogation-requests/MatchRequestCard";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import type { DerogationContextDto, DerogationRequestSummaryDto } from "@/lib/api/derogationRequests";

/**
 * Fiche match PUBLIQUE : bloc « Demande de dérogation » pour un coach (ou
 * coordinateur / admin) reconnu par son lien personnel — retour du club,
 * 2026-10-01 : « les joueurs avec le rôle coach doivent avoir la possibilité
 * de demander une dérogation depuis la page match ». Invisible pour tout
 * autre visiteur : la fiche publique reste en lecture seule.
 */
export function PublicMatchRequestBlock({ clubSlug, matchId }: { clubSlug: string; matchId: string }) {
  const { identity } = usePublicIdentity();
  const allowed = Boolean(identity && (identity.derogationRequests.canCreate || identity.derogationRequests.canManage));
  const source = useMemo<DerogationSource | null>(() => (identity && allowed ? { kind: "public", clubSlug, token: identity.token } : null), [allowed, clubSlug, identity]);
  const [data, setData] = useState<{ key: string; context: DerogationContextDto; requests: DerogationRequestSummaryDto[] } | null>(null);
  const key = `${matchId}|${source?.kind === "public" ? source.token : ""}`;

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    const client = derogationClient(source);
    Promise.all([client.context(), client.list({ matchId, limit: 5 })])
      .then(([context, list]) => {
        if (!cancelled) setData({ key, context, requests: list.requests });
      })
      // Bloc secondaire : une erreur ici ne doit jamais gêner la lecture du match.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [source, matchId, key]);

  if (!source || !data || data.key !== key) return null;
  const canCreate = data.context.canCreate && data.context.eligibleMatches.some((m) => m.id === matchId);
  if (data.requests.length === 0 && !canCreate) return null;

  return <MatchRequestCard requests={data.requests} canCreate={canCreate} timezone={data.context.timezone} basePath={`/public/${clubSlug}/derogations`} matchId={matchId} />;
}
