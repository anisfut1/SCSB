"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CalendarX2, ChevronRight, Dumbbell, MapPin, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { useConfirm } from "@/components/ui/Dialog";
import { FormMessage, Select } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Toast } from "@/components/ui/Toast";
import { groupByDay } from "@/features/public-home/group-by-day";
import type { TrainingOccurrenceDto, TrainingSeriesDto } from "@/lib/api/teamLife";
import { addDaysToDateString, todayInTimezone } from "@/lib/timezone";
import type { VenueOption } from "./LocationPicker";
import { OccurrenceSheet } from "./OccurrenceSheet";
import { SeriesEditSheet } from "./SeriesEditSheet";
import { TrainingPlannerSheet } from "./TrainingPlannerSheet";
import { countsSummary, formatDateKey, locationLabel, seasonEndKey, seriesLabel, timeOf } from "./labels";
import type { TeamLifeClient } from "./team-life-client";
import { zonedIso } from "@/features/derogation-requests/labels";

/** Séances affichées : les 4 prochaines semaines. */
const UPCOMING_DAYS = 28;

/**
 * Entraînements d'une équipe (coach / admin), mêmes écrans dans l'espace
 * club et l'espace public : créneaux de la semaine (planifier, modifier à
 * partir d'une date, arrêter), puis prochaines séances avec les réponses
 * reçues ; une séance s'ouvre en détail (qui vient, annuler, modifier).
 */
export function TeamTrainingsManager({
  client,
  teams,
  timezone,
  loadVenues,
  initialTeamId,
  initialOccurrenceId,
}: {
  client: TeamLifeClient;
  teams: { id: string; name: string }[];
  timezone: string;
  loadVenues: () => Promise<VenueOption[]>;
  initialTeamId?: string | null;
  initialOccurrenceId?: string | null;
}) {
  const [teamId, setTeamId] = useState(() => (initialTeamId && teams.some((t) => t.id === initialTeamId) ? initialTeamId : (teams[0]?.id ?? "")));
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [data, setData] = useState<{ teamId: string; series: TrainingSeriesDto[]; trainings: TrainingOccurrenceDto[]; error: string | null } | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [planning, setPlanning] = useState(false);
  const [editing, setEditing] = useState<TrainingSeriesDto | null>(null);
  const [openOccurrence, setOpenOccurrence] = useState<string | null>(initialOccurrenceId ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const today = todayInTimezone(timezone);
  const team = teams.find((t) => t.id === teamId);

  useEffect(() => {
    let cancelled = false;
    loadVenues()
      .then((v) => !cancelled && setVenues(v))
      .catch(() => undefined); // Pas de liste de gymnases : saisie libre du lieu.
    return () => {
      cancelled = true;
    };
  }, [loadVenues]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    const from = new Date().toISOString();
    const to = zonedIso(addDaysToDateString(todayInTimezone(timezone), UPCOMING_DAYS), "00:00", timezone);
    Promise.all([client.listSeries(teamId), client.listTrainings(teamId, { from, to })])
      .then(([s, t]) => !cancelled && setData({ teamId, series: s.series, trainings: t.trainings, error: null }))
      .catch((err: unknown) => !cancelled && setData({ teamId, series: [], trainings: [], error: err instanceof Error ? err.message : "Chargement impossible." }));
    return () => {
      cancelled = true;
    };
  }, [client, teamId, timezone, reloadCount]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);
  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  async function stop(series: TrainingSeriesDto) {
    const ok = await confirm({
      title: "Arrêter ce créneau ?",
      description: `${seriesLabel(series)} : plus de séance à partir d'aujourd'hui. Les séances où quelqu'un a déjà répondu restent visibles, marquées « annulées ».`,
      confirmLabel: "Arrêter le créneau",
      destructive: true,
    });
    if (!ok) return;
    setActionError(null);
    try {
      await client.stopSeries(series.id, today);
      flash("Créneau arrêté.");
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action impossible.");
    }
  }

  if (teams.length === 0) {
    return <EmptyState icon={<Dumbbell />} title="Aucune équipe à gérer" description="Les entraînements se planifient pour les équipes que tu coaches. Un administrateur du club peut t'y associer depuis la liste des joueurs." />;
  }

  const loading = !data || data.teamId !== teamId;
  const upcoming = data?.trainings ?? [];

  return (
    <div className="flex flex-col gap-8">
      {teams.length > 1 ? (
        <Select aria-label="Équipe" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="sm:max-w-xs">
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      ) : null}

      {loading ? (
        <ListSkeleton rows={4} />
      ) : data.error ? (
        <ErrorState title="Entraînements indisponibles" description={data.error} />
      ) : (
        <>
          <section aria-labelledby="series-title" className="flex flex-col gap-3">
            <SectionHeader
              id="series-title"
              title="Créneaux de la semaine"
              description={team ? `Les entraînements habituels de ${team.name}.` : undefined}
              action={
                data.series.length ? (
                  <Button variant="secondary" size="sm" icon={<CalendarPlus />} onClick={() => setPlanning(true)}>
                    Ajouter
                  </Button>
                ) : null
              }
            />
            {data.series.length === 0 ? (
              <Card className="flex flex-col items-start gap-3">
                <div>
                  <p className="text-[15px] font-semibold text-foreground">Aucun entraînement planifié</p>
                  <p className="type-meta mt-0.5">Indique les créneaux de la semaine une fois : les séances de toute la saison sont créées, et les joueurs peuvent répondre.</p>
                </div>
                <Button variant="primary" icon={<CalendarPlus />} onClick={() => setPlanning(true)}>
                  Planifier les entraînements
                </Button>
              </Card>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.series.map((s) => (
                  <li key={s.id}>
                    <Card padded={false} className="flex items-center gap-3 p-3.5">
                      <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-info-soft text-info [&_svg]:size-[18px]">
                        <Dumbbell />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="type-numeric text-[14.5px] font-semibold text-foreground">{seriesLabel(s)}</p>
                        <p className="type-meta truncate">
                          {locationLabel(s.location) ? `${locationLabel(s.location)} · ` : ""}jusqu&apos;au {formatDateKey(s.endsOn)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" icon={<Pencil />} onClick={() => setEditing(s)}>
                          <span className="sr-only sm:not-sr-only">Modifier</span>
                        </Button>
                        <Button variant="danger-ghost" size="sm" icon={<CalendarX2 />} onClick={() => void stop(s)}>
                          <span className="sr-only sm:not-sr-only">Arrêter</span>
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            {actionError ? <FormMessage tone="danger">{actionError}</FormMessage> : null}
          </section>

          <section aria-labelledby="sessions-title" className="flex flex-col gap-3">
            <SectionHeader id="sessions-title" title="Prochaines séances" description="Réponses reçues des joueurs. Touchez une séance pour voir qui vient, l'annuler ou la modifier." />
            {upcoming.length === 0 ? (
              <p className="type-meta">Aucune séance dans les 4 prochaines semaines.</p>
            ) : (
              <ol className="flex flex-col gap-5">
                {groupByDay(upcoming, (t) => t.startsAt, timezone).map((g) => (
                  <li key={g.key} className="flex flex-col gap-2">
                    <h3 className="border-b border-border pb-1.5 text-[14.5px] font-semibold text-foreground">{g.label}</h3>
                    <ul className="flex flex-col gap-2">
                      {g.items.map((t) => (
                        <li key={t.id}>
                          <button type="button" onClick={() => setOpenOccurrence(t.id)} className="block w-full rounded-[18px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                            <Card variant="interactive" padded={false} className={cn("flex items-center gap-3 p-3.5", t.status === "cancelled" && "opacity-70")}>
                              <div className="w-12 shrink-0 text-center">
                                <p className={cn("type-numeric text-[15px] font-semibold text-foreground", t.status === "cancelled" && "line-through")}>{timeOf(t.startsAt, timezone)}</p>
                                <p className="type-meta type-numeric">{timeOf(t.endsAt, timezone)}</p>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-medium text-foreground">{t.counts ? countsSummary(t.counts) : "Entraînement"}</p>
                                {locationLabel(t.location) ? (
                                  <p className="type-meta flex items-center gap-1 truncate [&_svg]:size-3.5">
                                    <MapPin aria-hidden />
                                    {locationLabel(t.location)}
                                  </p>
                                ) : null}
                              </div>
                              {t.status === "cancelled" ? (
                                <StatusBadge size="sm" tone="danger">
                                  Annulée
                                </StatusBadge>
                              ) : t.isModified ? (
                                <StatusBadge size="sm" tone="warning">
                                  Modifiée
                                </StatusBadge>
                              ) : null}
                              <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle" />
                            </Card>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}

      {planning && team ? (
        <TrainingPlannerSheet
          open
          onClose={() => setPlanning(false)}
          client={client}
          teamId={team.id}
          teamName={team.name}
          venues={venues}
          today={today}
          seasonEnd={seasonEndKey(today)}
          onSaved={() => {
            flash("Entraînements planifiés.");
            reload();
          }}
        />
      ) : null}
      {editing ? (
        <SeriesEditSheet
          series={editing}
          onClose={() => setEditing(null)}
          client={client}
          venues={venues}
          today={today}
          onSaved={() => {
            flash("Créneau modifié.");
            reload();
          }}
        />
      ) : null}
      {openOccurrence ? (
        <OccurrenceSheet
          occurrenceId={openOccurrence}
          onClose={() => setOpenOccurrence(null)}
          client={client}
          venues={venues}
          timezone={timezone}
          onChanged={(updated) => {
            setData((d) => (d ? { ...d, trainings: d.trainings.map((t) => (t.id === updated.id ? updated : t)) } : d));
            flash(updated.status === "cancelled" ? "Séance annulée." : "Séance mise à jour.");
          }}
        />
      ) : null}
      {confirmDialog}
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
