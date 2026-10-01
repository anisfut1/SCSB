import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { MembersManager } from "@/features/admin/MembersManager";

/**
 * Membres & gymnases (club_admin) : rôles des membres — coachs (par équipe),
 * coordinateur des dérogations — et gymnases proposés dans le planning des
 * demandes de dérogation.
 */
export default async function ClubMembersAdminPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const [members, venues, teams] = await Promise.all([api.members.list(club.id), api.members.venues(club.id), api.clubs.teams(club.id)]);

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="Administration" title="Membres & gymnases" description="Qui peut demander une dérogation (coachs), qui la traite (coordinateur), et dans quels gymnases." />
      <MembersManager clubId={club.id} initialMembers={members} initialVenues={venues} teams={teams} />
    </PageContainer>
  );
}
