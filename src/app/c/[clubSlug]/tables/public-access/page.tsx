import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PublicAccessList } from "@/features/tables/PublicAccessList";
import { PublicLinkBanner } from "@/features/tables/PublicLinkBanner";

/**
 * Vue admin des accès publics sans compte (retour du club, 2026-09-29) : qui
 * a déjà revendiqué son lien personnel sur le lien commun. `club_admin`
 * uniquement — la gestion d'identité/accès est plus sensible que la simple
 * gestion des postes (voir club-manager-api/docs/PUBLIC_TABLE_ACCESS.md).
 */
export default async function PublicAccessPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const entries = await api.tables.listPublicAccess(club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Accès publics — Tables de marque</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Qui a déjà revendiqué son lien personnel sans compte. Réinitialise l&apos;accès d&apos;un licencié si son lien est perdu — ses affectations existantes ne sont jamais touchées.
        </p>
      </div>
      <PublicLinkBanner clubSlug={clubSlug} />
      <PublicAccessList clubId={club.id} entries={entries} />
    </div>
  );
}
