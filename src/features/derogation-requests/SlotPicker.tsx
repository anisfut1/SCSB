"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/components/ui/cn";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { ClubVenueDto, DerogationAvailabilityDto } from "@/lib/api/derogationRequests";
import { formatTime, localDateKey, upcomingWeekendDays, zonedIso } from "./labels";
import { AwaySlots, VenuePlanning, type SlotSelection } from "./VenuePlanning";

export const AWAY_NOTICE = "Match à l'extérieur — le créneau devra être confirmé avec le club adverse.";
export const PENDING_WARNING = "Une autre demande en cours vise ce créneau.";

/**
 * Choix de la DATE (étape « Date ») : samedis et dimanches à venir en
 * puces, puis « Autre date » (jour de semaine possible). Toutes les dates
 * sont des jours du calendrier du club (`timezone`).
 */
export function DateChooser({ timezone, value, onChange }: { timezone: string; value: string | null; onChange: (date: string) => void }) {
  const days = useMemo(() => upcomingWeekendDays(new Date(), timezone, 6), [timezone]);
  const isOther = value !== null && !days.some((d) => d.date === value);
  const [showOther, setShowOther] = useState(isOther);
  const tomorrow = useMemo(() => {
    const [y, m, d] = localDateKey(new Date(), timezone).split("-").map(Number) as [number, number, number];
    return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  }, [timezone]);

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="Week-ends à venir" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-6">
        {days.map((d) => {
          const active = value === d.date;
          return (
            <li key={d.date}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={d.label}
                onClick={() => {
                  setShowOther(false);
                  onChange(d.date);
                }}
                className={cn(
                  "flex h-[72px] w-full flex-col items-center justify-center gap-0.5 rounded-[12px] border transition-[background-color,border-color,box-shadow] duration-150",
                  active ? "border-accent bg-accent shadow-glow-sm [&_span]:text-accent-ink" : "border-border bg-surface-raised shadow-1 hover:border-border-strong",
                )}
              >
                <span className={cn("text-[10.5px] font-semibold tracking-[0.08em]", active ? "text-accent-text" : "text-subtle")}>{d.weekday}</span>
                <span className="type-numeric text-[20px] font-semibold leading-none text-foreground">{d.day}</span>
                <span className="text-[10.5px] font-medium tracking-[0.06em] text-muted">{d.month}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {showOther || isOther ? (
        <Field label="Autre date" hint="Un jour de semaine reste possible : la plage horaire n'est alors pas imposée.">
          {(props) => <Input {...props} type="date" min={tomorrow} value={isOther ? (value ?? "") : ""} onChange={(e) => e.target.value && onChange(e.target.value)} className="max-w-xs" />}
        </Field>
      ) : (
        <Button variant="ghost" size="sm" icon={<CalendarPlus />} onClick={() => setShowOther(true)} className="self-start">
          Choisir une date en semaine / Autre date
        </Button>
      )}
    </div>
  );
}

/**
 * Choix du CRÉNEAU pour une date : planning des gymnases (domicile) ou
 * heures (extérieur), puis « Choisir une autre heure » validée par l'API
 * (`derogation-slot-check`, mêmes règles que l'envoi — le serveur revalide
 * de toute façon à l'envoi).
 */
export function SlotChooser({
  clubId,
  matchId,
  date,
  timezone,
  venues,
  value,
  onChange,
}: {
  clubId: string;
  matchId: string;
  date: string;
  timezone: string;
  venues: ClubVenueDto[];
  value: SlotSelection | null;
  onChange: (selection: SlotSelection | null) => void;
}) {
  const [reload, setReload] = useState(0);
  // Résultat indexé par requête : un changement de date affiche le squelette sans setState synchrone dans l'effet.
  const requestKey = `${matchId}|${date}|${reload}`;
  const [loaded, setLoaded] = useState<{ key: string; availability: DerogationAvailabilityDto | null; error: string | null } | null>(null);
  const localTime = (iso: string) => formatTime(iso, timezone);

  useEffect(() => {
    let cancelled = false;
    browserApi.derogationRequests
      .availability(clubId, matchId, date)
      .then((result) => {
        if (!cancelled) setLoaded({ key: requestKey, availability: result, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ key: requestKey, availability: null, error: err instanceof ApiError ? err.message : "Impossible de charger les disponibilités." });
      });
    return () => {
      cancelled = true;
    };
  }, [clubId, matchId, date, requestKey]);

  const current = loaded?.key === requestKey ? loaded : null;
  const availability = current?.availability ?? null;
  const error = current?.error ?? null;

  if (error) {
    return (
      <ErrorState
        title="Disponibilités indisponibles"
        description={error}
        action={
          <Button variant="secondary" onClick={() => setReload((n) => n + 1)}>
            Réessayer
          </Button>
        }
      />
    );
  }

  if (!availability) {
    return (
      <div aria-busy className="flex flex-col gap-3" aria-label="Chargement des disponibilités">
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="hidden h-80 md:block" />
        </div>
      </div>
    );
  }

  const home = availability.matchType === "HOME";
  const noRule = availability.rules.earliestStart === null;

  return (
    <div className="flex flex-col gap-4">
      {home ? null : <Notice tone="info">{AWAY_NOTICE}</Notice>}
      {home && noRule ? <Notice tone="neutral">Aucune plage horaire n&apos;est définie par le club pour ce jour : choisis l&apos;heure qui convient, les conflits restent vérifiés.</Notice> : null}
      {home && !noRule ? (
        <p className="type-meta">
          Plage du club ce jour-là : <span className="type-numeric font-medium text-foreground">{availability.rules.earliestStart}</span> → <span className="type-numeric font-medium text-foreground">{availability.rules.latestStart}</span> (début du match) · durée prise en compte : {availability.rules.durationMinutes / 60} h.
        </p>
      ) : null}

      {home ? (
        availability.venues.length === 0 ? (
          <EmptyState compact title="Aucun gymnase actif" description="L'administrateur du club doit activer au moins un gymnase (Administration → Membres & gymnases)." />
        ) : (
          <VenuePlanning availability={availability} selected={value} onSelect={onChange} localTime={localTime} />
        )
      ) : availability.awayCandidateStartTimes.length === 0 ? (
        <p className="type-meta">Aucune heure suggérée ce jour-là : choisis une heure précise ci-dessous.</p>
      ) : (
        <AwaySlots slots={availability.awayCandidateStartTimes} selected={value} onSelect={onChange} localTime={localTime} />
      )}

      {value && value.warnings.length > 0 ? <Notice tone="warning">{PENDING_WARNING} Le coordinateur arbitrera.</Notice> : null}

      <CustomTime
        key={date}
        clubId={clubId}
        matchId={matchId}
        date={date}
        timezone={timezone}
        venues={home ? (availability.venues.length ? availability.venues.map((v) => v.venue) : venues) : []}
        home={home}
        onSelect={onChange}
      />
    </div>
  );
}

function CustomTime({
  clubId,
  matchId,
  date,
  timezone,
  venues,
  home,
  onSelect,
}: {
  clubId: string;
  matchId: string;
  date: string;
  timezone: string;
  venues: ClubVenueDto[];
  home: boolean;
  onSelect: (selection: SlotSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);

  if (!open) {
    return (
      <Button variant="ghost" size="sm" icon={<Clock3 />} onClick={() => setOpen(true)} className="self-start">
        Choisir une autre heure
      </Button>
    );
  }

  async function check() {
    if (!time) return;
    setChecking(true);
    setMessage(null);
    try {
      const startAt = zonedIso(date, time, timezone);
      const result = await browserApi.derogationRequests.checkSlot(clubId, matchId, startAt, home ? venueId || null : null);
      if (!result.ok) {
        setMessage({ tone: "danger", text: result.message ?? "Créneau impossible." });
        return;
      }
      const venue = venues.find((v) => v.id === venueId) ?? null;
      onSelect({
        venueId: home ? (venue?.id ?? null) : null,
        venueName: home ? (venue?.name ?? null) : null,
        startAt: result.startAt,
        endAt: result.endAt,
        localStart: formatTime(result.startAt, timezone),
        localEnd: formatTime(result.endAt, timezone),
        warnings: result.warnings,
      });
      setMessage({ tone: "success", text: `Créneau disponible : ${formatTime(result.startAt, timezone)} → ${formatTime(result.endAt, timezone)}${venue && home ? ` — ${venue.name}` : ""}.` });
    } catch (err) {
      setMessage({ tone: "danger", text: err instanceof ApiError ? err.message : "Vérification impossible pour le moment." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="surface-panel flex flex-col gap-3 p-4">
      <p className="type-card text-foreground">Choisir une autre heure</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Heure de début" className="sm:w-40">
          {(props) => <Input {...props} type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} />}
        </Field>
        {home && venues.length > 0 ? (
          <Field label="Gymnase" className="sm:min-w-56 sm:flex-1">
            {(props) => (
              <Select {...props} value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        ) : null}
        <Button variant="secondary" onClick={check} disabled={!time} loading={checking}>
          Vérifier ce créneau
        </Button>
      </div>
      {message ? (
        <Notice tone={message.tone} live>
          {message.text}
        </Notice>
      ) : null}
    </div>
  );
}
