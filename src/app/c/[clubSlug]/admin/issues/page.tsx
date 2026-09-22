import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { ResolveIssueButton } from "@/features/admin/ResolveIssueButton";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

/**
 * File de revue humaine (ARCHITECTURE.md §21) — §23 de la demande :
 * `GET /v1/clubs/:clubId/issues`, plus aucun SELECT Supabase.
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : `IssueDto` ne renvoie
 * pas les avertissements qualité détaillés (`quality_warnings`) ni le
 * dernier message d'erreur (`emarque_imports.last_error`) — seulement
 * `emarqueStatus` (`error`/`needs_review`). Le détail par match n'est donc
 * plus affiché ici ; le statut suffit pour identifier les matchs à
 * vérifier et déclencher l'action "Marquer comme vérifié".
 */
export default async function IssuesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const issues = await api.issues.list(club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Anomalies</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Matchs de {club.name} nécessitant une vérification manuelle (donnée ambiguë ou incohérente). Aucune
          correction de données ici : la revue confirme seulement que le match peut être considéré comme traité.
        </p>
      </div>

      {issues.length === 0 ? (
        <Card title="Aucune anomalie en attente">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Tout est à jour.</p>
        </Card>
      ) : (
        issues.map((issue) => (
          <Card key={issue.matchId} title={`Rencontre ${issue.numero ?? "?"} — vs ${issue.opponentName ?? "?"}`}>
            <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-black/60 dark:text-white/60">Date</dt>
                <dd>{formatDateTime(issue.matchDatetime)}</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Statut</dt>
                <dd>{issue.emarqueStatus}</dd>
              </div>
            </dl>

            <ResolveIssueButton clubId={club.id} matchId={issue.matchId} />
          </Card>
        ))
      )}
    </div>
  );
}
