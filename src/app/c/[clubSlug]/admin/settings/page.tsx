import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { Card } from "@/components/ui/Card";
import { ClubSettingsForm } from "@/features/admin/ClubSettingsForm";

/**
 * Réglages du club (§42 du brief SaaS) : uniquement le branding léger
 * (nom, nom court, fuseau horaire). Le code FFBB (identité du tenant côté
 * FFBB) reste visible en lecture seule ici, mais sa modification n'est pas
 * exposée en self-service — un changement de code FFBB re-questionnerait
 * tout le rapprochement des matchs déjà synchronisés (hors scope actuel).
 */
export default async function ClubSettingsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Réglages du club</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Code FFBB : {club.ffbbClubId} (non modifiable ici)</p>
      </div>

      <Card title="Identité du club">
        <ClubSettingsForm clubSlug={clubSlug} name={club.name} shortName={club.shortName} timezone={club.timezone} />
      </Card>
    </div>
  );
}
