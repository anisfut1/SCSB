import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_PLACEHOLDER_CARDS } from "@/config/site";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { hasAnyRole, isClubAdmin } from "@/lib/permissions/roles";

/**
 * Les cartes "Dérogations" et "Tables de marque" ne sont proposées qu'aux
 * rôles qui peuvent réellement ouvrir la page derrière (respectivement
 * club_admin, et club_admin/responsable_tables — §31 de la demande "Tables
 * de marque") : ces pages redirigent tout autre rôle vers ce dashboard
 * (requireClubAdminContext / requireAnyClubRoleContext), donc les afficher
 * à tout le monde ne mènerait qu'à un aller-retour sans rien montrer.
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
        {hasAnyRole(club.roles, ["club_admin", "responsable_tables"]) ? (
          <Link href={`/c/${clubSlug}/tables`}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                  Tables de marque
                </span>
              }
              description="Marqueur, chronométreur, délégué de club : à attribuer pour chaque match à domicile."
            />
          </Link>
        ) : null}
        {DASHBOARD_PLACEHOLDER_CARDS.map((card) => (
          <Card key={card.title} title={card.title} description={card.description} />
        ))}
      </div>
    </div>
  );
}
