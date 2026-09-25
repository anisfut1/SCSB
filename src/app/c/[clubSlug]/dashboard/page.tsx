import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_PLACEHOLDER_CARDS } from "@/config/site";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { isClubAdmin } from "@/lib/permissions/roles";

/**
 * La carte "Dérogations" n'est proposée qu'aux club_admin : la page qu'elle
 * ouvre (/admin/derogations) redirige tout autre rôle vers ce dashboard
 * (requireClubAdminContext), donc l'afficher à tout le monde ne mènerait
 * qu'à un aller-retour sans rien montrer.
 */
export default async function ClubDashboardPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href={`/c/${clubSlug}/matchs`}>
          <Card title="Matchs" description="Calendrier, résultats et composition, synchronisés automatiquement." />
        </Link>
        <Link href={`/c/${clubSlug}/joueurs`}>
          <Card title="Joueurs" description="Fiche par licencié : historique des matchs et statistiques." />
        </Link>
        {isClubAdmin(club.roles) ? (
          <Link href={`/c/${clubSlug}/admin/derogations`}>
            <Card title="Dérogations" description="Demandes de dérogation FBI connues pour le club, en lecture seule." />
          </Link>
        ) : null}
        {DASHBOARD_PLACEHOLDER_CARDS.map((card) => (
          <Card key={card.title} title={card.title} description={card.description} />
        ))}
      </div>
    </div>
  );
}
