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
 * `IssueDto` (gap 6 de la demande, côté club-manager-api) expose le détail
 * complet — `severity`/`message`/`technicalCode`/`qualityWarnings` —
 * jamais consommé ici jusqu'ici (cette page utilisait encore l'ancien champ
 * `emarqueStatus`, retiré du contrat OpenAPI).
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
        issues.map((issue, index) => (
          <Card
            key={`${issue.integration}-${issue.type}-${issue.matchId ?? "none"}-${issue.numero ?? "none"}-${index}`}
            title={`Rencontre ${issue.numero ?? "?"} — vs ${issue.opponentName ?? "?"}`}
          >
            <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-black/60 dark:text-white/60">Date</dt>
                <dd>{formatDateTime(issue.matchDatetime)}</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Sévérité</dt>
                <dd className={issue.severity === "error" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}>{issue.severity}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-black/60 dark:text-white/60">Détail</dt>
                <dd>{issue.message}</dd>
              </div>
            </dl>

            {issue.qualityWarnings.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-sm text-black/60 dark:text-white/60">
                {issue.qualityWarnings.map((warning, warningIndex) => (
                  <li key={`${issue.matchId ?? "none"}-${warning.code}-${warningIndex}`}>{warning.message}</li>
                ))}
              </ul>
            ) : null}

            {issue.integration === "emarque" && issue.matchId ? (
              <ResolveIssueButton clubId={club.id} matchId={issue.matchId} />
            ) : issue.integration === "fbi_schedule" ? (
              <p className="mt-4 text-xs text-black/50 dark:text-white/50">
                Anomalie de rapprochement calendrier FFBB/FBI — se résout automatiquement dès que le calendrier FFBB
                est corrigé et qu&apos;une nouvelle vérification est lancée (voir Intégrations → FBI).
              </p>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
