import Link from "next/link";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import type { LicencieDto } from "@/lib/api/licencies";
import type { TeamDto } from "@/lib/api/clubs";

function LicencieRow({ clubSlug, licencie }: { clubSlug: string; licencie: LicencieDto }) {
  return (
    <li>
      <Link href={`/c/${clubSlug}/joueurs/${licencie.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/10">
        <span className="flex items-center gap-3">
          {licencie.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL de photo arbitraire fournie par le club, hors domaines Next configurés
            <img src={licencie.photoUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="h-8 w-8 shrink-0 rounded-full bg-black/10 dark:bg-white/10" aria-hidden />
          )}
          <span>
            {licencie.lastName} {licencie.firstName}
            {!licencie.active ? <span className="ml-2 text-xs text-black/40 dark:text-white/40">(inactif·ve)</span> : null}
          </span>
        </span>
        <span className="text-sm text-black/40 dark:text-white/40">{licencie.licenseNumber ?? "—"}</span>
      </Link>
    </li>
  );
}

function TeamSection({ clubSlug, title, licencies }: { clubSlug: string; title: string; licencies: LicencieDto[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-black/70 dark:text-white/70">
        {title} <span className="font-normal text-black/40 dark:text-white/40">({licencies.length})</span>
      </h2>
      {licencies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/10 px-4 py-3 text-sm text-black/40 dark:border-white/10 dark:text-white/40">
          Aucun·e licencié·e rattaché·e à cette équipe pour l&apos;instant.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 rounded-lg border border-black/10 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {licencies.map((licencie) => (
            <LicencieRow key={licencie.id} clubSlug={clubSlug} licencie={licencie} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Roster du club, sectorisé par équipe (demande du club, voir
 * docs/TEAMS.md côté club-manager-api) — point d'entrée vers chaque fiche
 * individuelle. Affiche TOUTES les équipes (même sans licencié rattaché,
 * ex. une catégorie encore en brassage sans effectif connu) pour que
 * l'admin voie la structure complète du club, pas seulement les équipes
 * déjà peuplées.
 */
export default async function JoueursPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);
  const [licencies, teams] = await Promise.all([api.licencies.list(club.id), api.clubs.teams(club.id)]);

  if (licencies.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold">Licenciés</h1>
        <Card title="Aucun licencié pour l'instant">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Les licencié·e·s du club sont créé·e·s automatiquement à partir des documents e-Marque importés (numéro de licence lu sur une feuille de
            match), ou peuvent être ajouté·e·s manuellement par un·e administrateur·rice.
          </p>
        </Card>
      </div>
    );
  }

  const licenciesByTeamId = new Map<string, LicencieDto[]>();
  const licenciesWithoutTeam: LicencieDto[] = [];
  for (const licencie of licencies) {
    if (!licencie.teamId) {
      licenciesWithoutTeam.push(licencie);
      continue;
    }
    const bucket = licenciesByTeamId.get(licencie.teamId) ?? [];
    bucket.push(licencie);
    licenciesByTeamId.set(licencie.teamId, bucket);
  }

  const sortedTeams = [...teams].sort((a: TeamDto, b: TeamDto) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold">Licenciés</h1>

      {sortedTeams.map((team) => (
        <TeamSection key={team.id} clubSlug={clubSlug} title={team.name} licencies={licenciesByTeamId.get(team.id) ?? []} />
      ))}

      {licenciesWithoutTeam.length > 0 ? <TeamSection clubSlug={clubSlug} title="Sans équipe" licencies={licenciesWithoutTeam} /> : null}
    </div>
  );
}
