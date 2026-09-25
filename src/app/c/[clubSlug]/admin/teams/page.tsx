import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { TeamsManager } from "@/features/admin/TeamsManager";

/**
 * Gestion des équipes (demande du club, voir docs/TEAMS.md côté
 * club-manager-api) : créer/renommer/reclasser/activer une équipe AVANT
 * même tout engagement FFBB confirmé (catégories encore en phase de
 * brassage en 2026-2027).
 */
export default async function ClubTeamsAdminPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const teams = await api.clubs.teams(club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Équipes</h1>
      </div>

      <Card title="Équipes du club">
        <div className="mt-2">
          <TeamsManager clubId={club.id} teams={teams} />
        </div>
      </Card>
    </div>
  );
}
