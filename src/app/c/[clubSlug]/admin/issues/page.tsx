import { AlertOctagon, AlertTriangle, CalendarDays, CheckCircle2, FileWarning, ShieldCheck, Wrench } from "lucide-react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { ResolveIssueButton } from "@/features/admin/ResolveIssueButton";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "—";
}

const INTEGRATION_LABELS: Record<string, string> = { emarque: "e-Marque", fbi_schedule: "Calendrier FBI", scheduling: "Planning" };

/**
 * File de revue humaine (ARCHITECTURE.md §21) — §23 de la demande :
 * `GET /v1/clubs/:clubId/issues`, plus aucun SELECT Supabase. La sévérité
 * est toujours portée par une icône + un libellé, jamais par la couleur
 * seule.
 */
export default async function IssuesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  // Les anomalies « corrigées automatiquement » (FBI fait foi, rien à faire)
  // ne sont plus affichées — retour du club, 2026-10-01 : « n'affiche pas
  // sur le front ces anomalies, on s'en fout ». Seules restent celles qui
  // demandent une action.
  const issues = (await api.issues.list(club.id)).filter((issue) => issue.status !== "auto_corrected");
  const errors = issues.filter((i) => i.severity === "error" && i.status === "open").length;
  const warnings = issues.filter((i) => i.severity === "warning" && i.status === "open").length;

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Administration"
        title="Anomalies"
        description={`Matchs de ${club.name} nécessitant une vérification manuelle (donnée ambiguë ou incohérente). Aucune correction de données ici : la revue confirme seulement que le match peut être considéré comme traité.`}
        meta={
          issues.length > 0 ? (
            <>
              <StatusBadge tone="danger" icon={<AlertOctagon />}>
                {errors} erreur{errors > 1 ? "s" : ""}
              </StatusBadge>
              <StatusBadge tone="warning" icon={<AlertTriangle />}>
                {warnings} avertissement{warnings > 1 ? "s" : ""}
              </StatusBadge>
            </>
          ) : null
        }
      />

      {issues.length === 0 ? (
        <EmptyState icon={<ShieldCheck />} title="Aucune anomalie en attente" description="Tout est à jour." />
      ) : (
        <ul className="flex flex-col gap-3">
          {issues.map((issue, index) => {
            const corrected = issue.status === "auto_corrected";
            const isError = issue.severity === "error";
            return (
              <li key={`${issue.integration}-${issue.type}-${issue.matchId ?? "none"}-${issue.numero ?? "none"}-${index}`}>
                <Card className="overflow-hidden p-0 sm:p-0" padded={false}>
                  <div className="flex">
                    <span aria-hidden className={cn("w-1 shrink-0", corrected ? "bg-success" : isError ? "bg-danger" : "bg-warning")} />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="text-reflow">
                          <p className="type-eyebrow">{INTEGRATION_LABELS[issue.integration] ?? issue.integration}</p>
                          <h2 className="type-card mt-1 text-foreground">{`Rencontre ${issue.numero ?? "?"} — vs ${issue.opponentName ?? "?"}`}</h2>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {corrected ? (
                            <StatusBadge tone="success" icon={<CheckCircle2 />} size="sm">
                              Corrigée automatiquement
                            </StatusBadge>
                          ) : (
                            <StatusBadge tone={isError ? "danger" : "warning"} icon={isError ? <AlertOctagon /> : <AlertTriangle />} size="sm">
                              {isError ? "Erreur" : "Avertissement"}
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed text-foreground">{issue.message}</p>

                      <p className="type-meta flex items-center gap-1.5">
                        <CalendarDays aria-hidden className="size-3.5 text-subtle" />
                        {formatDateTime(issue.matchDatetime)}
                        <span aria-hidden className="text-subtle">·</span>
                        <span className="font-mono text-[11.5px]">{issue.technicalCode}</span>
                      </p>

                      {issue.qualityWarnings.length > 0 ? (
                        <ul className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2.5">
                          {issue.qualityWarnings.map((warning, warningIndex) => (
                            <li key={`${issue.matchId ?? "none"}-${warning.code}-${warningIndex}`} className="flex items-start gap-2 text-[13px] text-muted">
                              <FileWarning aria-hidden className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                              {warning.message}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                        {issue.integration === "emarque" && issue.matchId ? (
                          <>
                            <ResolveIssueButton clubId={club.id} matchId={issue.matchId} />
                            <ButtonLink href={`/c/${clubSlug}/matchs/${issue.matchId}?tab=emarque`} variant="ghost" size="sm">
                              Ouvrir le match
                            </ButtonLink>
                          </>
                        ) : issue.integration === "fbi_schedule" ? (
                          <p className="type-meta flex items-start gap-2">
                            <Wrench aria-hidden className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                            {corrected
                              ? "FBI fait référence en cas d'écart de date/heure ou de salle : le calendrier a été corrigé automatiquement avec la valeur FBI, aucune action nécessaire."
                              : "Rencontre visible d'un seul côté (FBI ou FFBB) — FBI seul n'a pas assez d'information pour créer/compléter un match, une vérification manuelle est nécessaire (voir Intégrations → FBI)."}
                          </p>
                        ) : issue.integration === "scheduling" ? (
                          <p className="type-meta flex items-start gap-2">
                            <Wrench aria-hidden className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                            Conflit d&apos;horaire/lieu entre deux rencontres à domicile — se résout en corrigeant la date/heure ou le lieu de l&apos;une des deux rencontres côté FFBB, constaté automatiquement au prochain chargement de cette page.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
