"use client";

import { ListSkeleton } from "@/components/ui/Skeleton";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";
import { PublicLoginPanel } from "@/features/public/PublicLoginApp";
import { BoardView } from "./BoardView";

/**
 * Onglet Tables de l'espace public : identification par lien personnel
 * envoyé par email (`PublicLoginPanel`, retour du club, 2026-10-01) puis
 * tableau de positionnement (`BoardView`). L'identité est partagée par tout
 * l'espace public (`PublicIdentityProvider`, posé par le layout) — aucune
 * session Supabase nulle part dans cet arbre.
 */
export function PublicTablesApp({ clubSlug, clubTimezone }: { clubSlug: string; clubTimezone: string }) {
  const { identity, forget } = usePublicIdentity();

  if (identity === undefined) return <ListSkeleton rows={4} />;

  if (identity === null) {
    return <PublicLoginPanel returnTo="tables" title="Tables de marque" lead="Retrouve ton nom pour recevoir ton lien d'accès par email, puis positionne-toi sur les matchs à domicile." />;
  }

  return <BoardView clubSlug={clubSlug} clubTimezone={clubTimezone} token={identity.token} me={identity.licencie} canManage={identity.tables.canManage} onLogout={forget} />;
}
