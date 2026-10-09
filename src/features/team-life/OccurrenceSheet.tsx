"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Clock, HelpCircle, MapPin, Pencil, RotateCcw, X } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, Input } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { cn } from "@/components/ui/cn";
import type { TrainingAttendanceValue, TrainingOccurrenceDetailDto, TrainingOccurrenceDto } from "@/lib/api/teamLife";
import { LocationPicker, locationBody, type LocationValue, type VenueOption } from "./LocationPicker";
import { dateKeyOf, dayOf, locationLabel, responseLabel, timeOf } from "./labels";
import { ChoiceButtons, type Choice } from "./ResponseButtons";
import type { TeamLifeClient } from "./team-life-client";

type Mode = "view" | "edit" | "cancel";

/**
 * Détail d'une séance (coach / admin) : qui vient, qui ne vient pas, qui n'a
 * pas répondu ; annuler (la séance reste visible « annulée »), rétablir, ou
 * modifier CETTE séance seulement (le créneau ne change pas).
 */
export function OccurrenceSheet({ occurrenceId, onClose, client, venues, timezone, onChanged }: { occurrenceId: string; onClose: () => void; client: TeamLifeClient; venues: VenueOption[]; timezone: string; onChanged: (training: TrainingOccurrenceDto, silent?: boolean) => void }) {
  const [detail, setDetail] = useState<TrainingOccurrenceDetailDto | null>(null);
  // Séance terminée : figé au chargement (jamais `Date.now()` pendant le rendu).
  const [past, setPast] = useState(false);
  // Séance commencée : relevé des absents / retards (présence réelle, ≠ réponse prévue).
  const [started, setStarted] = useState(false);
  const [marks, setMarks] = useState<Record<string, TrainingAttendanceValue | null>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState<{ date: string; startTime: string; endTime: string; location: LocationValue } | null>(null);

  useEffect(() => {
    let cancelled = false;
    client
      .detail(occurrenceId)
      .then((d) => {
        if (cancelled) return;
        setPast(new Date(d.training.endsAt).getTime() < Date.now());
        setStarted(new Date(d.training.startsAt).getTime() <= Date.now());
        setMarks(Object.fromEntries(d.roster.map((r) => [r.licencie.id, r.attendance])));
        setDetail(d);
      })
      .catch((err: unknown) => !cancelled && setLoadError(err instanceof Error ? err.message : "Chargement impossible."));
    return () => {
      cancelled = true;
    };
  }, [client, occurrenceId]);

  const t = detail?.training;

  async function run(action: () => Promise<TrainingOccurrenceDto>) {
    setBusy(true);
    setError(null);
    try {
      const updated = await action();
      setDetail((d) => (d ? { ...d, training: updated } : d));
      onChanged(updated);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    if (!t) return;
    setEdit({ date: dateKeyOf(t.startsAt, timezone), startTime: timeOf(t.startsAt, timezone), endTime: timeOf(t.endsAt, timezone), location: { clubVenueId: t.location.clubVenueId, locationLabel: t.location.clubVenueId ? null : t.location.label } });
    setMode("edit");
  }

  /** Présent / Retard / Absent : enregistré tout de suite, retour en arrière si l'envoi échoue. */
  async function mark(licencieId: string, status: TrainingAttendanceValue) {
    if (!t) return;
    const previous = marks[licencieId] ?? null;
    const next = { ...marks, [licencieId]: status };
    setMarks(next);
    setError(null);
    try {
      await client.markAttendance(t.id, licencieId, status);
      const values = Object.values(next);
      onChanged({ ...t, attendance: { late: values.filter((v) => v === "LATE").length, absent: values.filter((v) => v === "ABSENT").length, recorded: true } }, true);
    } catch {
      setMarks((m) => ({ ...m, [licencieId]: previous }));
      setError("Impossible d'enregistrer la présence.");
    }
  }

  const title = t ? `Entraînement ${dayOf(t.startsAt, timezone)}` : "Séance";

  const footer =
    !t || past ? undefined : mode === "edit" && edit ? (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setMode("view")}>
          Retour
        </Button>
        <Button
          variant="primary"
          loading={busy}
          onClick={() => {
            if (edit.endTime <= edit.startTime) return setError("L'heure de fin doit être après l'heure de début.");
            void run(() => client.updateOccurrence(t.id, { date: edit.date, startTime: edit.startTime, endTime: edit.endTime, ...locationBody(edit.location) }));
          }}
        >
          Enregistrer cette séance
        </Button>
      </div>
    ) : mode === "cancel" ? (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setMode("view")}>
          Retour
        </Button>
        <Button variant="danger" loading={busy} onClick={() => void run(() => client.cancel(t.id, reason.trim() || null))}>
          Annuler la séance
        </Button>
      </div>
    ) : t.status === "cancelled" ? (
      <Button variant="secondary" icon={<RotateCcw />} loading={busy} onClick={() => void run(() => client.restore(t.id))}>
        Rétablir la séance
      </Button>
    ) : (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="danger-ghost" icon={<Ban />} onClick={() => setMode("cancel")}>
          Annuler la séance
        </Button>
        <Button variant="secondary" icon={<Pencil />} onClick={startEdit}>
          Modifier cette séance
        </Button>
      </div>
    );

  return (
    <Sheet open onClose={onClose} title={title} description={t ? `${t.team.name} · ${timeOf(t.startsAt, timezone)}–${timeOf(t.endsAt, timezone)}` : undefined} footer={footer}>
      {loadError ? (
        <ErrorState title="Séance indisponible" description={loadError} />
      ) : !detail || !t ? (
        <ListSkeleton rows={5} />
      ) : mode === "edit" && edit ? (
        <div className="flex flex-col gap-4">
          <p className="type-meta">Seule cette séance change ; le créneau habituel reste le même pour les autres semaines.</p>
          <Field label="Date">{(props) => <Input type="date" {...props} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />}</Field>
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" aria-label="Début" value={edit.startTime} step={300} onChange={(e) => setEdit({ ...edit, startTime: e.target.value })} />
            <Input type="time" aria-label="Fin" value={edit.endTime} step={300} onChange={(e) => setEdit({ ...edit, endTime: e.target.value })} />
          </div>
          <LocationPicker idPrefix={`occ-${t.id}`} venues={venues} value={edit.location} onChange={(location) => setEdit({ ...edit, location })} />
          {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        </div>
      ) : mode === "cancel" ? (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-foreground">La séance restera visible, marquée « annulée ». Plus personne ne pourra y répondre.</p>
          <Field label="Motif" optional hint="Visible par l'équipe (ex. gymnase indisponible).">
            {(props) => <Input {...props} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            {t.status === "cancelled" ? <StatusBadge tone="danger">Annulée{t.cancelReason ? ` — ${t.cancelReason}` : ""}</StatusBadge> : null}
            {t.isModified ? <StatusBadge tone="warning">Modifiée</StatusBadge> : null}
            {past ? <StatusBadge tone="neutral">Terminée</StatusBadge> : null}
            {locationLabel(t.location) ? (
              <span className="type-meta inline-flex items-center gap-1 [&_svg]:size-3.5">
                <MapPin aria-hidden />
                {locationLabel(t.location)}
              </span>
            ) : null}
          </div>

          {t.counts && started ? <p className="type-meta -mb-3">Réponses données avant la séance :</p> : null}
          {t.counts ? (
            <dl className="grid grid-cols-4 gap-2">
              {(
                [
                  ["Présents", t.counts.present, "text-success"],
                  ["Absents", t.counts.absent, "text-danger"],
                  ["Incertains", t.counts.uncertain, "text-warning"],
                  ["Sans réponse", t.counts.noResponse, "text-muted"],
                ] as const
              ).map(([label, value, tone]) => (
                <div key={label} className="flex flex-col items-center rounded-[12px] border border-border bg-surface-raised px-1 py-2.5 text-center">
                  <dd className={cn("type-numeric text-[20px] font-semibold", tone)}>{value}</dd>
                  <dt className="text-[11.5px] font-medium text-muted">{label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          {started && t.status === "scheduled" && detail.roster.length ? (
            <p className="type-meta">Présence réelle : tout le monde est « Présent » par défaut, marque seulement les retards et les absents. La pastille à droite rappelle la réponse donnée avant la séance.</p>
          ) : null}
          {detail.roster.length === 0 ? (
            <p className="type-meta">Aucun joueur n&apos;est rattaché à cette équipe pour l&apos;instant (liste des joueurs).</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border bg-surface-raised">
              {detail.roster.map((r) => (
                <li key={r.licencie.id} className="flex flex-col gap-2 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={`${r.licencie.firstName} ${r.licencie.lastName}`} src={r.licencie.photoUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                      {r.licencie.firstName} {r.licencie.lastName}
                    </span>
                    <ResponsePill response={r.response} />
                  </div>
                  {started && t.status === "scheduled" ? (
                    <ChoiceButtons
                      choices={ATTENDANCE_CHOICES}
                      value={marks[r.licencie.id] ?? "PRESENT"}
                      onChange={(v) => void mark(r.licencie.id, v)}
                      label={`Présence de ${r.licencie.firstName}`}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        </div>
      )}
    </Sheet>
  );
}

const ATTENDANCE_CHOICES: Choice<TrainingAttendanceValue>[] = [
  { value: "PRESENT", label: "Présent·e", icon: <Check />, tone: "success" },
  { value: "LATE", label: "Retard", icon: <Clock />, tone: "warning" },
  { value: "ABSENT", label: "Absent·e", icon: <X />, tone: "danger" },
];

function ResponsePill({ response }: { response: TrainingOccurrenceDetailDto["roster"][number]["response"] }) {
  if (!response) return <StatusBadge size="sm" tone="neutral">Sans réponse</StatusBadge>;
  const tone = response === "PRESENT" ? "success" : response === "ABSENT" ? "danger" : "warning";
  const Icon = response === "PRESENT" ? Check : response === "ABSENT" ? X : HelpCircle;
  return (
    <StatusBadge size="sm" tone={tone} icon={<Icon />}>
      {responseLabel(response)}
    </StatusBadge>
  );
}
