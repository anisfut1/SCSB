import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { Card } from "@/components/ui/Card";
import { ClubSettingsForm } from "@/features/admin/ClubSettingsForm";

/**
 * Réglages du club (§42 du brief SaaS) : uniquement le branding léger
 * (nom, nom court, fuseau horaire).
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : deux limitations liées
 * à l'absence de route `PATCH /v1/clubs/:clubId` côté club-manager-api —
 * 1) le code FFBB (`ClubDto` ne l'expose pas) n'est plus affiché ici ;
 * 2) `ClubSettingsForm` écrit encore directement sur la table `clubs` via
 * un client Supabase lié à la session (RLS, PAS service role) plutôt que
 * via l'API — catégorie D (conservé temporairement, voir
 * docs/MIGRATION_TO_API.md) : aucun remplacement fonctionnel n'existe
 * encore, et §1 de la demande interdit de supprimer une fonctionnalité
 * avant son remplacement. Aucun secret ni service_role n'est utilisé par
 * cette écriture.
 */
export default async function ClubSettingsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Réglages du club</h1>
      </div>

      <Card title="Identité du club">
        <ClubSettingsForm clubSlug={clubSlug} name={club.name} shortName={club.shortName} timezone={club.timezone} />
      </Card>
    </div>
  );
}
