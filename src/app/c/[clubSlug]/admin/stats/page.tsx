import { AlertOctagon, CalendarDays, CheckCircle2, Clock3, FileX2, Loader2, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import type { EmarqueTrackingMatchDto, EmarqueTrackingState } from "@/lib/api/emarqueTracking";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { RelaunchEmarqueButton } from "@/features/admin/RelaunchEmarqueButton";

const STATE: Record<EmarqueTrackingState, { label: string; tone: BadgeTone; icon: ReactNode; bar: string; order: number }> = {
  needs_review: { label: "À vérifier — non publié", tone: "danger", icon: <AlertOctagon />, bar: "bg-danger", order: 0 },
  error: { label: "Erreur de lecture", tone: "danger", icon: <AlertOctagon />, bar: "bg-danger", order: 1 },
  not_available: { label: "Pas de feuille e-Marque", tone: "warning", icon: <FileX2 />, bar: "bg-warning", order: 2 },
  processing: { label: "Lecture en cours", tone: "info", icon: <Loader2 />, bar: "bg-info", order: 3 },
  waiting: { label: "En attente de la feuille", tone: "info", icon: <Clock3 />, bar: "bg-info", order: 4 },
  published: { label: "Stats publiées", tone: "success", icon: <CheckCircle2 />, bar: "bg-success", order: 5 },
};

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
}

function matchTitle(m: EmarqueTrackingMatchDto): string {
  const team = m.teamName ?? "Équipe";
  const opponent = m.opponentName ?? "?";
  return m.isHome === false ? `${opponent} – ${team}` : `${team} – ${opponent}`;
}

/**
 * Suivi des statistiques e-Marque (retour du club, 2026-10-06 : « je veux
 * un process clair... pas au hasard ») — un état lisible par match joué,
 * le prochain essai prévu et la raison exacte quand les stats ne sont pas
 * publiées. Source : `GET /v1/clubs/:clubId/emarque-tracking`.
 */
export default async function StatsTrackingPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const matches = [...(await api.emarqueTracking.list(club.id))].sort(
    (a, b) => STATE[a.state].order - STATE[b.state].order || (b.matchDatetime ?? "").localeCompare(a.matchDatetime ?? ""),
  );

  const count = (state: EmarqueTrackingState) => matches.filter((m) => m.state === state).length;
  const toCheck = count("needs_review") + count("error");

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Administration"
        title="Suivi des stats"
        description="Chaque match joué suit le même processus automatique, sans intervention : la feuille e-Marque est cherchée sur FBI à horaires fixes, lue, contrôlée, puis publiée."
        meta={
          matches.length > 0 ? (
            <>
              <StatusBadge tone="success" icon={<CheckCircle2 />}>
                {count("published")} publiée{count("published") > 1 ? "s" : ""}
              </StatusBadge>
              <StatusBadge tone="info" icon={<Clock3 />}>
                {count("waiting") + count("processing")} en cours
              </StatusBadge>
              {toCheck > 0 ? (
                <StatusBadge tone="danger" icon={<AlertOctagon />}>
                  {toCheck} à vérifier
                </StatusBadge>
              ) : null}
              {count("not_available") > 0 ? (
                <StatusBadge tone="warning" icon={<FileX2 />}>
                  {count("not_available")} sans feuille
                </StatusBadge>
              ) : null}
            </>
          ) : null
        }
      />

      <Card className="mb-4">
        <h2 className="type-card text-foreground">Le processus, match par match</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>Le match passe « joué » sur la FFBB (vérifié toutes les 15 min).</li>
          <li>
            La feuille est cherchée sur FBI à horaires fixes à partir de la fin du match : toutes les 15 min pendant 6 h, puis toutes les heures jusqu&apos;à 48 h, puis
            toutes les 6 h jusqu&apos;à 7 jours. Une panne FBI ne fait jamais abandonner : nouvel essai au créneau suivant.
          </li>
          <li>La feuille trouvée est téléchargée et lue dans la foulée, les matchs les plus anciens d&apos;abord.</li>
          <li>
            Contrôles avant publication : score de la feuille = score FFBB, total des points des joueurs de chaque équipe = score de l&apos;équipe, aucun maillot en double.
            Si un contrôle échoue, rien n&apos;est publié et le match apparaît ici « à vérifier », avec la raison.
          </li>
          <li>Sans feuille 7 jours après le match : « pas de feuille e-Marque ». « Relancer » refait un essai tout de suite, puis 7 nouveaux jours.</li>
        </ol>
      </Card>

      {matches.length === 0 ? (
        <EmptyState icon={<ShieldCheck />} title="Aucun match joué cette saison" description="Les matchs apparaîtront ici dès qu'ils seront joués." />
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((m) => {
            const state = STATE[m.state];
            const showRelaunch = m.state !== "processing";
            return (
              <li key={m.matchId}>
                <Card className="overflow-hidden p-0 sm:p-0" padded={false}>
                  <div className="flex">
                    <span aria-hidden className={cn("w-1 shrink-0", state.bar)} />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="text-reflow min-w-0">
                          <p className="type-eyebrow">{`Rencontre ${m.numero ?? "?"}`}</p>
                          <h2 className="type-card mt-1 text-foreground">{matchTitle(m)}</h2>
                          <p className="type-meta mt-1 flex flex-wrap items-center gap-1.5">
                            <CalendarDays aria-hidden className="size-3.5 text-subtle" />
                            {formatDateTime(m.matchDatetime)}
                            {m.scoreHome !== null && m.scoreAway !== null ? (
                              <>
                                <span aria-hidden className="text-subtle">·</span>
                                <span className="tabular-nums">{`${m.scoreHome} – ${m.scoreAway}`}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <StatusBadge tone={state.tone} icon={state.icon} size="sm">
                          {state.label}
                        </StatusBadge>
                      </div>

                      <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
                        {m.state === "waiting" || m.state === "processing" ? (
                          <div className="flex gap-1.5">
                            <dt className="text-subtle">Prochain essai :</dt>
                            <dd className="text-foreground">{m.nextCheckAt ? formatDateTime(m.nextCheckAt) : "au prochain passage"}</dd>
                          </div>
                        ) : null}
                        {m.lastCheckAt ? (
                          <div className="flex gap-1.5">
                            <dt className="text-subtle">Dernier essai :</dt>
                            <dd className="text-foreground">{`${formatDateTime(m.lastCheckAt)}${m.lastCheckResult ? ` — ${m.lastCheckResult}` : ""}`}</dd>
                          </div>
                        ) : null}
                        {m.importedAt ? (
                          <div className="flex gap-1.5">
                            <dt className="text-subtle">Lu le :</dt>
                            <dd className="text-foreground">{formatDateTime(m.importedAt)}</dd>
                          </div>
                        ) : null}
                        {m.clubPlayersTotal > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Users aria-hidden className="size-3.5 text-subtle" />
                            <dt className="text-subtle">Joueurs du club rattachés :</dt>
                            <dd className={cn("tabular-nums", m.clubPlayersLinked < m.clubPlayersTotal ? "text-warning" : "text-foreground")}>
                              {`${m.clubPlayersLinked}/${m.clubPlayersTotal}`}
                            </dd>
                          </div>
                        ) : null}
                      </dl>

                      {m.problems.length > 0 ? (
                        <ul className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-surface px-3 py-2.5">
                          {m.problems.map((problem, index) => (
                            <li key={`${m.matchId}-problem-${index}`} className="flex items-start gap-2 text-[13px] text-foreground">
                              <AlertOctagon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-danger" />
                              {problem}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="flex flex-wrap items-start gap-3 border-t border-border pt-3">
                        {showRelaunch ? <RelaunchEmarqueButton clubId={club.id} matchId={m.matchId} /> : null}
                        <ButtonLink href={`/c/${clubSlug}/matchs/${m.matchId}?tab=emarque`} variant="ghost" size="sm">
                          Ouvrir le match
                        </ButtonLink>
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
