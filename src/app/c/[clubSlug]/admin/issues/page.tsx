import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { resolveMatchIssueAction } from "@/server/actions/emarque-issues";

interface QualityWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

/**
 * File de revue humaine (ARCHITECTURE.md §21), scopée à CE club (§29 du
 * brief SaaS) : un problème FBI/e-Marque d'un autre club de la plateforme
 * n'apparaît jamais ici.
 */
export default async function IssuesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, numero, opponent_name, match_datetime, emarque_status")
    .eq("club_id", club.id)
    .in("emarque_status", ["needs_review", "error"])
    .order("match_datetime", { ascending: false });

  const matchIds = (matches ?? []).map((m) => m.id);

  type EmarqueImportSummary = {
    match_id: string;
    status: string;
    quality_warnings: unknown;
    last_error: string | null;
    created_at: string;
  };

  const imports: EmarqueImportSummary[] = matchIds.length
    ? ((
        await supabase
          .from("emarque_imports")
          .select("match_id, status, quality_warnings, last_error, created_at")
          .eq("club_id", club.id)
          .in("match_id", matchIds)
          .order("created_at", { ascending: false })
      ).data ?? [])
    : [];

  const latestImportByMatchId = new Map<string, EmarqueImportSummary>();
  for (const imp of imports ?? []) {
    if (!latestImportByMatchId.has(imp.match_id)) {
      latestImportByMatchId.set(imp.match_id, imp);
    }
  }

  const resolveThisClubIssue = resolveMatchIssueAction.bind(null, clubSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Anomalies</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Matchs de {club.name} nécessitant une vérification manuelle (donnée ambiguë ou incohérente). Aucune
          correction de données ici : la revue confirme seulement que le match peut être considéré comme traité.
        </p>
      </div>

      {!matches || matches.length === 0 ? (
        <Card title="Aucune anomalie en attente">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Tout est à jour.</p>
        </Card>
      ) : (
        matches.map((match) => {
          const latestImport = latestImportByMatchId.get(match.id);
          const warnings = (latestImport?.quality_warnings as QualityWarning[] | null) ?? [];

          return (
            <Card key={match.id} title={`Rencontre ${match.numero ?? "?"} — vs ${match.opponent_name ?? "?"}`}>
              <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-black/60 dark:text-white/60">Date</dt>
                  <dd>{formatDateTime(match.match_datetime)}</dd>
                </div>
                <div>
                  <dt className="text-black/60 dark:text-white/60">Statut</dt>
                  <dd>{match.emarque_status}</dd>
                </div>
              </dl>

              {latestImport?.last_error ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{latestImport.last_error}</p>
              ) : null}

              {warnings.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {warnings.map((warning, index) => (
                    <li
                      key={index}
                      className={
                        warning.severity === "error"
                          ? "text-red-600 dark:text-red-400"
                          : warning.severity === "warning"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-black/60 dark:text-white/60"
                      }
                    >
                      [{warning.code}] {warning.message}
                    </li>
                  ))}
                </ul>
              ) : null}

              <form action={resolveThisClubIssue.bind(null, match.id)} className="mt-4">
                <button
                  type="submit"
                  className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  Marquer comme vérifié
                </button>
              </form>
            </Card>
          );
        })
      )}
    </div>
  );
}
