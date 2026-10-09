"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PublicLoginPanel } from "@/features/public/PublicLoginApp";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import { publicTeamLife } from "@/lib/api/teamLife";
import { getDeviceTokens } from "@/lib/publicToken";
import { PlanningView } from "./PlanningView";

/**
 * Planning de l'espace public : équipes de TOUS les liens de l'appareil
 * (enfants, équipes coachées), matchs + entraînements.
 */
export function PublicPlanningApp({ clubSlug, club }: { clubSlug: string; club: { name: string; timezone: string } }) {
  const { identity } = usePublicIdentity();
  const token = identity?.token;
  const load = useCallback(
    (period: { from: string; to: string }) => publicTeamLife.planning(clubSlug, [...new Set([token!, ...getDeviceTokens(clubSlug)])], { from: period.from, to: period.to }),
    [clubSlug, token],
  );

  if (identity === undefined) return <ListSkeleton rows={5} />;
  if (identity === null) return <PublicLoginPanel returnTo="accueil" title="Planning" lead="Les matchs et entraînements de ton équipe (ou de tes enfants) au même endroit : retrouve ton nom pour recevoir ton lien d'accès par email." />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={club.name} title="Planning" description="Matchs et entraînements de tes équipes, semaine par semaine." />
      <PlanningView timezone={club.timezone} load={load} matchHref={(id) => `/public/${clubSlug}/matchs/${id}`} />
    </div>
  );
}
