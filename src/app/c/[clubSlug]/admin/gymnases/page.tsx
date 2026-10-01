import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { VenuesManager } from "@/features/admin/VenuesManager";

/**
 * Gymnases proposés dans le planning des demandes de dérogation (club_admin).
 * Les rôles Coach / Coordinateur se posent depuis la liste des joueurs
 * (retour du club, 2026-10-01 : « comme on a fait pour l'admin »).
 */
export default async function ClubVenuesAdminPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const venues = await api.members.venues(club.id);

  return (
    <PageContainer>
      <PageHeader eyebrow="Administration" title="Gymnases" description="Gymnases proposés dans le planning des demandes de dérogation. Ils sont repris automatiquement des matchs à domicile synchronisés depuis la FFBB." />
      <VenuesManager clubId={club.id} clubSlug={clubSlug} initialVenues={venues} />
    </PageContainer>
  );
}
