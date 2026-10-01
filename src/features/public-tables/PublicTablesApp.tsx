"use client";

import { ListSkeleton } from "@/components/ui/Skeleton";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import { IdentifyView } from "@/features/public/IdentifyView";
import { BoardView } from "./BoardView";

/**
 * Onglet Tables de l'espace public : identification par lien personnel
 * envoyé par email (`IdentifyView`, retour du club, 2026-10-01) puis
 * tableau de positionnement (`BoardView`). L'identité est partagée par tout
 * l'espace public (`PublicIdentityProvider`, posé par le layout) — aucune
 * session Supabase nulle part dans cet arbre.
 */
export function PublicTablesApp({ clubSlug, clubName, clubTimezone }: { clubSlug: string; clubName: string; clubTimezone: string }) {
  const { identity, forget } = usePublicIdentity();

  if (identity === undefined) return <ListSkeleton rows={4} />;

  if (identity === null) {
    return (
      <IdentifyView
        clubSlug={clubSlug}
        clubName={clubName}
        returnTo="tables"
        title="Tables de marque"
        description="Retrouve ton nom pour recevoir ton lien personnel par email, puis positionne-toi sur les matchs à domicile."
      />
    );
  }

  return <BoardView clubSlug={clubSlug} clubTimezone={clubTimezone} token={identity.token} me={identity.licencie} onLogout={forget} />;
}
