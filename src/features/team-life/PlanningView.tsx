"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, MapPin, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { Select } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { zonedIso } from "@/features/derogation-requests/labels";
import { groupByDay } from "@/features/public-home/group-by-day";
import type { PlanningDto, PlanningEventDto } from "@/lib/api/teamLife";
import { addDaysToDateString, todayInTimezone } from "@/lib/timezone";
import { formatDateKey, timeOf } from "./labels";

type KindFilter = "ALL" | "MATCH" | "TRAINING";

/** Lundi (« AAAA-MM-JJ ») de la semaine qui contient `dateKey`. */
export function mondayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDaysToDateString(dateKey, -((weekday + 6) % 7));
}

/**
 * Planning (Vie d'équipe, Lot 1) : matchs FFBB + entraînements dans une
 * seule liste, semaine par semaine, groupés par jour. Mobile d'abord : une
 * colonne, navigation semaine précédente / suivante au pouce. Mêmes écrans
 * pour l'espace club et l'espace public — seul `load` change.
 */
export function PlanningView({
  timezone,
  load,
  matchHref,
  trainingHref,
  teams,
}: {
  timezone: string;
  load: (period: { from: string; to: string; teamId?: string }) => Promise<PlanningDto>;
  matchHref: (matchId: string) => string;
  /** Lien vers la gestion d'une séance (coach / admin) — sinon la séance n'est pas cliquable. */
  trainingHref?: (event: PlanningEventDto) => string | null;
  /** Filtre par équipe (espace club). */
  teams?: { id: string; name: string }[];
}) {
  const [week, setWeek] = useState(() => mondayOf(todayInTimezone(timezone)));
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [teamId, setTeamId] = useState("");
  const [result, setResult] = useState<{ key: string; data: PlanningDto | null; error: Error | null } | null>(null);

  const requestKey = `${week}|${teamId}`;
  useEffect(() => {
    let cancelled = false;
    const from = zonedIso(week, "00:00", timezone);
    const to = zonedIso(addDaysToDateString(week, 7), "00:00", timezone);
    load({ from, to, teamId: teamId || undefined })
      .then((data) => !cancelled && setResult({ key: requestKey, data, error: null }))
      .catch((err: unknown) => !cancelled && setResult({ key: requestKey, data: null, error: err instanceof Error ? err : new Error("Chargement impossible.") }));
    return () => {
      cancelled = true;
    };
  }, [load, requestKey, teamId, timezone, week]);

  const loading = !result || result.key !== requestKey;
  const events = useMemo(() => (result?.data?.events ?? []).filter((e) => kind === "ALL" || e.kind === kind), [kind, result]);
  const thisWeek = mondayOf(todayInTimezone(timezone));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <IconButton label="Semaine précédente" variant="outline" onClick={() => setWeek((w) => addDaysToDateString(w, -7))}>
            <ChevronLeft />
          </IconButton>
          <div className="min-w-0 flex-1 text-center sm:min-w-56 sm:flex-none">
            <p className="text-[15px] font-semibold text-foreground">{week === thisWeek ? "Cette semaine" : week === addDaysToDateString(thisWeek, 7) ? "Semaine prochaine" : `Semaine du ${formatDateKey(week).replace(/ \d{4}$/, "")}`}</p>
            <p className="type-meta type-numeric">
              {formatDateKey(week).replace(/ \d{4}$/, "")} – {formatDateKey(addDaysToDateString(week, 6)).replace(/ \d{4}$/, "")}
            </p>
          </div>
          <IconButton label="Semaine suivante" variant="outline" onClick={() => setWeek((w) => addDaysToDateString(w, 7))}>
            <ChevronRight />
          </IconButton>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Type d'événement" className="inline-flex rounded-[12px] border border-border bg-surface-muted p-0.5">
            {(
              [
                ["ALL", "Tout"],
                ["MATCH", "Matchs"],
                ["TRAINING", "Entraînements"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "h-10 rounded-[10px] px-3 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-150 sm:h-9",
                  kind === value ? "bg-surface-raised text-foreground shadow-[var(--shadow-inset-highlight),var(--shadow-1),0_0_0_1px_var(--border)]" : "text-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {teams && teams.length > 1 ? (
            <Select aria-label="Équipe" value={teamId} onChange={(e) => setTeamId(e.target.value)} className="h-10 w-auto min-w-40 sm:h-9">
              <option value="">Toutes les équipes</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          ) : null}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : result?.error ? (
        <ErrorState title="Planning indisponible" description={result.error.message} />
      ) : events.length === 0 ? (
        <EmptyState
          compact
          icon={<CalendarDays />}
          title="Rien de prévu cette semaine"
          description={kind === "TRAINING" ? "Aucun entraînement planifié sur cette semaine." : kind === "MATCH" ? "Aucun match cette semaine." : "Ni match ni entraînement sur cette semaine."}
        />
      ) : (
        <ol className="flex flex-col gap-6">
          {groupByDay(events, (e) => e.startsAt, timezone).map((g) => (
            <li key={g.key} className="flex flex-col gap-2.5">
              <h3 className="border-b border-border pb-1.5 text-[15px] font-semibold text-foreground">{g.label}</h3>
              <ul className="flex flex-col gap-2">
                {g.items.map((e) => {
                  const href = e.kind === "MATCH" ? matchHref(e.id) : (trainingHref?.(e) ?? null);
                  const card = <PlanningEventCard event={e} timezone={timezone} interactive={Boolean(href)} />;
                  return (
                    <li key={`${e.kind}-${e.id}`}>
                      {href ? (
                        <Link href={href} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                          {card}
                        </Link>
                      ) : (
                        card
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function PlanningEventCard({ event, timezone, interactive }: { event: PlanningEventDto; timezone: string; interactive: boolean }) {
  const cancelled = event.status === "cancelled";
  const isMatch = event.kind === "MATCH";
  return (
    <Card variant={interactive ? "interactive" : "default"} padded={false} className={cn("flex items-start gap-3 p-3.5", cancelled && "opacity-70")}>
      <div className="flex w-12 shrink-0 flex-col items-center pt-0.5">
        <span className={cn("type-numeric text-[15px] font-semibold text-foreground", cancelled && "line-through")}>{timeOf(event.startsAt, timezone)}</span>
        {event.endsAt ? <span className="type-meta type-numeric">{timeOf(event.endsAt, timezone)}</span> : null}
      </div>
      <span aria-hidden className={cn("mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] [&_svg]:size-[18px]", isMatch ? "bg-accent-soft text-accent-text" : "bg-info-soft text-info")}>
        {isMatch ? <Trophy /> : <Dumbbell />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-reflow text-[14.5px] font-semibold leading-snug text-foreground", cancelled && "line-through")}>{isMatch ? `Match contre ${event.title}` : event.title}</p>
        <p className="type-meta mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {event.team ? <span>{event.team.name}</span> : null}
          {isMatch && event.isHome !== null ? <span>{event.isHome ? "Domicile" : "Extérieur"}</span> : null}
          {event.location ? (
            <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5">
              <MapPin aria-hidden />
              <span className="truncate">{event.location}</span>
            </span>
          ) : null}
        </p>
      </div>
      {cancelled ? (
        <StatusBadge size="sm" tone="danger">
          Annulé
        </StatusBadge>
      ) : null}
    </Card>
  );
}
