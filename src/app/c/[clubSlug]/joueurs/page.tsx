import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { isClubAdmin } from "@/lib/permissions/roles";
import { ImportLicenciesPanel } from "@/features/licencies/ImportLicenciesPanel";
import { RosterBoard } from "@/features/licencies/RosterBoard";

/**
 * Roster du club, sectorisé par équipe (demande du club, voir
 * docs/TEAMS.md côté club-manager-api) — point d'entrée vers chaque fiche
 * individuelle. Affiche TOUTES les équipes (même sans licencié rattaché,
 * ex. une catégorie encore en brassage sans effectif connu) pour que
 * l'admin voie la structure complète du club, pas seulement les équipes
 * déjà peuplées.
 *
 * `club_admin` : import en masse depuis un export FBI + glisser-déposer
 * pour réaffecter un licencié d'une équipe à l'autre (demande du club,
 * 2026-09-28 : "ajoute les tous stp... Fais moi un truc ou jpeux glisser
 * les cartes pr les mettre d'une equipe a lautre").
 */
export default async function JoueursPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);
  const isAdmin = isClubAdmin(club.roles);
  const [licencies, teams] = await Promise.all([api.licencies.list(club.id), api.clubs.teams(club.id)]);

  if (licencies.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold">Licenciés</h1>
        {isAdmin ? <ImportLicenciesPanel clubId={club.id} /> : null}
        <Card title="Aucun licencié pour l'instant">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Les licencié·e·s du club sont créé·e·s automatiquement à partir des documents e-Marque importés (numéro de licence lu sur une feuille de
            match), ou peuvent être ajouté·e·s manuellement par un·e administrateur·rice.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Licenciés</h1>
      {isAdmin ? <ImportLicenciesPanel clubId={club.id} /> : null}
      <RosterBoard clubId={club.id} clubSlug={clubSlug} licencies={licencies} teams={teams} isAdmin={isAdmin} />
    </div>
  );
}
