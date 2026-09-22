import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

const EMARQUE_STATUS_LABELS: Record<string, string> = {
  not_applicable: "Non concerné",
  pending: "En attente de traitement",
  waiting_for_emarque: "En attente du document FBI",
  discovered: "Document découvert",
  downloading: "Téléchargement en cours",
  downloaded: "Téléchargé",
  parsing: "Traitement en cours",
  imported: "Importé",
  error: "Erreur",
  needs_review: "À vérifier",
};

/**
 * Tableau de bord de synchronisation (ARCHITECTURE.md §20/§21), scopé à CE
 * club — §22 de la demande : `GET /v1/clubs/:clubId/sync-runs` +
 * `GET /v1/clubs/:clubId/matches` (statuts e-Marque dérivés côté
 * frontend), plus aucun accès Supabase direct.
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : la section "Derniers
 * imports e-Marque" (liste `emarque_imports` : tentatives, dates de
 * découverte) n'a pas d'équivalent API — aucune route ne l'expose. Retirée
 * de cette page en attendant une route dédiée côté club-manager-api.
 */
export default async function SyncDashboardPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const [syncRuns, matches] = await Promise.all([api.integrations.syncRuns(club.id), api.matches.list(club.id)]);

  const statusCounts = new Map<string, number>();
  for (const match of matches) {
    statusCounts.set(match.emarqueStatus, (statusCounts.get(match.emarqueStatus) ?? 0) + 1);
  }

  const recentSyncRuns = syncRuns.slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Synchronisation</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Suivi des dernières exécutions automatiques pour {club.name}. Cette page est un tableau de bord de lecture —
          les jobs tournent seuls (cron côté club-manager-api), sans intervention nécessaire ici.
        </p>
      </div>

      <Card title="Matchs par statut e-Marque">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {Object.entries(EMARQUE_STATUS_LABELS).map(([status, label]) => (
            <div key={status}>
              <dt className="text-black/60 dark:text-white/60">{label}</dt>
              <dd className="text-lg font-semibold">{statusCounts.get(status) ?? 0}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Dernières synchronisations FFBB / FBI">
        {recentSyncRuns.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {recentSyncRuns.map((run) => (
              <li key={run.id} className="flex flex-col gap-0.5 border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {run.provider.toUpperCase()} — {formatDateTime(run.startedAt)}
                  </span>
                  <span className="text-black/60 dark:text-white/60">{run.status}</span>
                </div>
                {run.errorLog ? <span className="text-xs text-red-600 dark:text-red-400">{run.errorLog}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucune synchronisation exécutée pour l&apos;instant.</p>
        )}
      </Card>
    </div>
  );
}
