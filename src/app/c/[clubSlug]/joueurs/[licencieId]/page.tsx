import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { isClubAdmin } from "@/lib/permissions/roles";
import { Card } from "@/components/ui/Card";
import { LicencieProfileEditForm } from "@/features/licencies/LicencieProfileEditForm";
import type { LicencieMatchDto } from "@/lib/api/licencies";

const MATCH_STATUS_LABELS: Record<string, string> = {
  scheduled: "À venir",
  played: "Joué",
  postponed: "Reporté",
  cancelled: "Annulé",
  forfeit: "Forfait",
};

function formatSecondsPlayed(seconds: number | null): string {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatMatchDate(value: string | null): string {
  if (!value) return "Date à confirmer";
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

/** "fiche joueur" (demande du club) : identité + tous ses matchs + ses statistiques par match, voir docs/LICENCIES.md côté club-manager-api. */
export default async function LicencieProfilePage({ params }: { params: Promise<{ clubSlug: string; licencieId: string }> }) {
  const { clubSlug, licencieId } = await params;
  const club = await requireClubContext(clubSlug);

  let profile;
  try {
    profile = await api.licencies.get(club.id, licencieId);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const { licencie, matches, isSelf } = profile;
  const editMode: "admin" | "self" | null = isClubAdmin(club.roles) ? "admin" : isSelf ? "self" : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/c/${clubSlug}/joueurs`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour aux licenciés
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {licencie.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL de photo arbitraire fournie par le club, hors domaines Next configurés
          <img src={licencie.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="h-16 w-16 shrink-0 rounded-full bg-black/10 dark:bg-white/10" aria-hidden />
        )}
        <div>
          <h1 className="text-lg font-semibold">
            {licencie.lastName} {licencie.firstName}
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {licencie.licenseNumber ?? "Numéro de licence non renseigné"}
            {!licencie.active ? " · inactif·ve" : ""}
          </p>
        </div>
      </div>

      {editMode ? (
        <Card title="Profil">
          <div className="mt-2">
            <LicencieProfileEditForm clubId={club.id} licencie={licencie} mode={editMode} />
          </div>
        </Card>
      ) : (licencie.email || licencie.phone) ? (
        <Card title="Contact">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {licencie.email ?? "—"} {licencie.phone ? `· ${licencie.phone}` : ""}
          </p>
        </Card>
      ) : null}

      <Card title={`Matchs (${matches.length})`}>
        {matches.length === 0 ? (
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Aucun match trouvé pour ce·tte licencié·e pour l&apos;instant.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-black/60 dark:text-white/60">
                  <th className="pr-2">Match</th>
                  <th className="px-2">Date</th>
                  <th className="px-2 text-right">Maillot</th>
                  <th className="px-2 text-right">Temps</th>
                  <th className="px-2 text-right">Pts</th>
                  <th className="px-2 text-right">3pts</th>
                  <th className="px-2 text-right">2int</th>
                  <th className="px-2 text-right">2ext</th>
                  <th className="px-2 text-right">LF</th>
                  <th className="px-2 text-right">Fautes</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m: LicencieMatchDto) => (
                  <tr key={m.matchId} className="border-t border-black/5 dark:border-white/10">
                    <td className="py-1 pr-2">
                      <Link href={`/c/${clubSlug}/matchs/${m.matchId}`} className="hover:underline">
                        {m.isHome === false ? `@ ${m.opponentName ?? "?"}` : (m.opponentName ?? "?")}
                      </Link>
                      <span className="ml-1 text-xs text-black/40 dark:text-white/40">({MATCH_STATUS_LABELS[m.status] ?? m.status})</span>
                    </td>
                    <td className="px-2 text-black/60 dark:text-white/60">{formatMatchDate(m.matchDatetime)}</td>
                    <td className="px-2 text-right">
                      #{m.jerseyNumber ?? "?"}
                      {m.isCaptain ? " (C)" : ""}
                    </td>
                    <td className="px-2 text-right">{formatSecondsPlayed(m.stats?.secondsPlayed ?? null)}</td>
                    <td className="px-2 text-right">{m.stats?.points ?? "—"}</td>
                    <td className="px-2 text-right">{m.stats?.threePointsMade ?? "—"}</td>
                    <td className="px-2 text-right">{m.stats?.twoPointsInteriorMade ?? "—"}</td>
                    <td className="px-2 text-right">{m.stats?.twoPointsExteriorMade ?? "—"}</td>
                    <td className="px-2 text-right">{m.stats?.freeThrowsMade ?? "—"}</td>
                    <td className="px-2 text-right">{m.stats?.foulsCommitted ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
