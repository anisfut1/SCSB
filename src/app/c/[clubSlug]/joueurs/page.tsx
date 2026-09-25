import Link from "next/link";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";

/**
 * Roster du club (demande du club, "fiche joueur avec tous ses matchs et
 * ses stats par match", voir docs/LICENCIES.md côté club-manager-api) —
 * point d'entrée vers chaque fiche individuelle.
 */
export default async function JoueursPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);
  const licencies = await api.licencies.list(club.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Licenciés</h1>

      {licencies.length === 0 ? (
        <Card title="Aucun licencié pour l'instant">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Les licencié·e·s du club sont créé·e·s automatiquement à partir des documents e-Marque importés (numéro de licence lu sur une feuille de
            match), ou peuvent être ajouté·e·s manuellement par un·e administrateur·rice.
          </p>
        </Card>
      ) : (
        <ul className="divide-y divide-black/5 rounded-lg border border-black/10 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {licencies.map((licencie) => (
            <li key={licencie.id}>
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
          ))}
        </ul>
      )}
    </div>
  );
}
