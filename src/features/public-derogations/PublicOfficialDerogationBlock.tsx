"use client";

import { FileSignature } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { CreateDerogationAction } from "@/features/derogations/CreateDerogationAction";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import { createPublicDerogation } from "@/lib/api/publicTables";
import { canManageOfficialDerogations } from "./PublicDerogationsApp";

/**
 * Fiche match PUBLIQUE : « Créer une dérogation » officielle (FBI) pour un
 * admin du club ou le coordinateur reconnu par son lien personnel — retour
 * du club, 2026-10-02 : « le coordinateur doit avoir les mêmes droits qu'un
 * admin général sur les dérogations, pour créer une dérogation officielle ».
 * Même formulaire que la fiche match de l'espace club ; invisible pour tout
 * autre visiteur. ÉCRIT réellement sur FBI.
 */
export function PublicOfficialDerogationBlock({ clubSlug, matchId }: { clubSlug: string; matchId: string }) {
  const { identity } = usePublicIdentity();
  if (!identity || !canManageOfficialDerogations(identity)) return null;

  return (
    <Card>
      <CardHeader icon={<FileSignature />} title="Dérogation officielle (FBI)" description="Envoie directement la demande de dérogation sur FBI pour ce match, comme depuis l'espace club." />
      <div className="mt-4">
        <CreateDerogationAction clubId={clubSlug} matchId={matchId} submit={(body) => createPublicDerogation(clubSlug, identity.token, matchId, body)} />
      </div>
    </Card>
  );
}
