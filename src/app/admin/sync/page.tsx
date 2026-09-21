import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

const EMARQUE_STATUS_LABELS: Record<string, string> = {
  not_applicable: "Non concerné",
  pending: "En attente de traitement",
  waiting_for_emarque: "En attente du document FBI",
  imported: "Importé",
  error: "Erreur",
  needs_review: "À vérifier",
};

/**
 * Tableau de bord de synchronisation (ARCHITECTURE.md §20/§21) : vue de
 * suivi uniquement, aucune action manuelle sur fichier ici — les seules
 * actions possibles sont un déclenchement manuel de sync (déjà sur
 * /admin/integrations) et la revue des anomalies (/admin/issues).
 */
export default async function SyncDashboardPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data: recentSyncRuns }, { data: matches }, { data: recentImports }] = await Promise.all([
    supabase.from("sync_runs").select("*").order("started_at", { ascending: false }).limit(10),
    supabase.from("matches").select("id, numero, emarque_status"),
    supabase.from("emarque_imports").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const statusCounts = new Map<string, number>();
  for (const match of matches ?? []) {
    statusCounts.set(match.emarque_status, (statusCounts.get(match.emarque_status) ?? 0) + 1);
  }

  const numeroByMatchId = new Map((matches ?? []).map((m) => [m.id, m.numero]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Synchronisation</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Suivi des dernières exécutions automatiques. Cette page est un tableau de bord de lecture — les jobs
          tournent seuls (cron), sans intervention nécessaire ici.
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

      <Card title="Dernières synchronisations FFBB">
        {recentSyncRuns && recentSyncRuns.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {recentSyncRuns.map((run) => {
              const stats = run.stats as Record<string, number> | null;
              return (
                <li key={run.id} className="flex flex-col gap-0.5 border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatDateTime(run.started_at)}</span>
                    <span className="text-black/60 dark:text-white/60">{run.status}</span>
                  </div>
                  {stats ? (
                    <span className="text-xs text-black/60 dark:text-white/60">
                      {stats.matchesCreated ?? 0} créés · {stats.matchesUpdated ?? 0} mis à jour ·{" "}
                      {stats.changesDetected ?? 0} changements · {stats.errors ?? 0} erreurs
                    </span>
                  ) : null}
                  {run.error_log ? <span className="text-xs text-red-600 dark:text-red-400">{run.error_log}</span> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucune synchronisation exécutée pour l&apos;instant.</p>
        )}
      </Card>

      <Card title="Derniers imports e-Marque">
        {recentImports && recentImports.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {recentImports.map((imp) => (
              <li key={imp.id} className="flex flex-col gap-0.5 border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Rencontre {numeroByMatchId.get(imp.match_id) ?? "?"}</span>
                  <span className="text-black/60 dark:text-white/60">{imp.status}</span>
                </div>
                <span className="text-xs text-black/60 dark:text-white/60">
                  {formatDateTime(imp.discovered_at)}
                  {imp.attempt_count > 0 ? ` · ${imp.attempt_count} tentative(s)` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucun import e-Marque pour l&apos;instant.</p>
        )}
      </Card>
    </div>
  );
}
