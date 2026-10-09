"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { StatusBadge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/Field";
import { Sheet } from "@/components/ui/Sheet";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { zonedIso } from "@/features/derogation-requests/labels";
import type { ConvocationPreviewDto, MatchAvailabilityValue, MatchTeamLifeDto } from "@/lib/api/teamLife";
import { dateKeyOf, matchTitle, shortDateTime, timeOf } from "./labels";
import type { TeamLifeClient } from "./team-life-client";

type Step = "select" | "meeting" | "preview";

export const AVAILABILITY_BADGE: Record<MatchAvailabilityValue | "NONE", { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: "Disponible", tone: "success" },
  UNCERTAIN: { label: "Incertain·e", tone: "warning" },
  NONE: { label: "Sans réponse", tone: "neutral" },
  UNAVAILABLE: { label: "Indisponible", tone: "danger" },
};

/** Heure de rendez-vous : « 1h avant » etc., à partir de l'heure du match (fuseau du club). */
function minus(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number) as [number, number];
  const total = (h * 60 + m - minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Préparer / modifier la convocation, en trois écrans courts (mobile d'abord) :
 * 1. qui (disponibles d'abord, statut visible, alerte si indisponible) ;
 * 2. rendez-vous (heure, lieu — obligatoire à l'extérieur —, message) ;
 * 3. aperçu réel de ce que recevront les familles, puis « Envoyer ».
 * Rien n'est visible des familles avant l'envoi.
 */
export function ConvocationSheet({ client, data, timezone, initialStep = "select", onClose, onSent }: { client: TeamLifeClient; data: MatchTeamLifeDto; timezone: string; initialStep?: Step; onClose: () => void; onSent: (dto: MatchTeamLifeDto) => void }) {
  const match = data.match;
  const matchTime = match.startsAt ? timeOf(match.startsAt, timezone) : "18:00";
  const matchDay = match.startsAt ? dateKeyOf(match.startsAt, timezone) : null;
  const [step, setStep] = useState<Step>(initialStep);
  const [ready, setReady] = useState(Boolean(data.convocation));
  const [selected, setSelected] = useState<Set<string>>(new Set(data.convocation?.draft.licencieIds ?? []));
  const [meetingTime, setMeetingTime] = useState(data.convocation?.draft.meetingAt ? timeOf(data.convocation.draft.meetingAt, timezone) : minus(matchTime, 60));
  const [meetingPoint, setMeetingPoint] = useState(data.convocation?.draft.meetingPoint ?? (match.isHome !== false ? (match.venueName ?? "") : ""));
  const [message, setMessage] = useState(data.convocation?.draft.coachMessage ?? "");
  const [preview, setPreview] = useState<ConvocationPreviewDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revision = data.convocation?.revision ?? 0;

  // Première préparation : l'API crée le brouillon avec les disponibles présélectionnés.
  useEffect(() => {
    if (data.convocation) return;
    let cancelled = false;
    client
      .saveDraft(match.id, {})
      .then((dto) => {
        if (cancelled) return;
        setSelected(new Set(dto.convocation?.draft.licencieIds ?? []));
        setReady(true);
      })
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : "Préparation impossible."));
    return () => {
      cancelled = true;
    };
  }, [client, data.convocation, match.id]);

  const unavailableSelected = data.availability.roster.filter((r) => r.response === "UNAVAILABLE" && selected.has(r.licencie.id));

  async function goPreview() {
    setError(null);
    if (!matchDay) return setError("La date du match n'est pas encore connue.");
    if (match.isHome === false && !meetingPoint.trim()) return setError("Match à l'extérieur : indique le lieu de rendez-vous.");
    setBusy(true);
    try {
      await client.saveDraft(match.id, { licencieIds: [...selected], meetingAt: zonedIso(matchDay, meetingTime, timezone), meetingPoint: meetingPoint.trim() || null, coachMessage: message.trim() || null });
      setPreview(await client.preview(match.id));
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aperçu impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      onSent(await client.send(match.id));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  }

  // Ouvert directement sur l'aperçu (match modifié par la FFBB) : on le charge.
  useEffect(() => {
    if (initialStep !== "preview" || !data.convocation) return;
    let cancelled = false;
    client
      .preview(match.id)
      .then((p) => !cancelled && setPreview(p))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : "Aperçu impossible."));
    return () => {
      cancelled = true;
    };
  }, [client, data.convocation, initialStep, match.id]);

  const footer =
    step === "select" ? (
      <div className="flex items-center justify-between gap-3">
        <p className="type-meta">
          <span className="type-numeric font-semibold text-foreground">{selected.size}</span> sélectionné{selected.size > 1 ? "s" : ""}
        </p>
        <Button variant="primary" disabled={!ready || selected.size === 0} onClick={() => setStep("meeting")}>
          Continuer
        </Button>
      </div>
    ) : step === "meeting" ? (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setStep("select")}>
          Retour
        </Button>
        <Button variant="primary" loading={busy} onClick={() => void goPreview()}>
          Voir l&apos;aperçu
        </Button>
      </div>
    ) : (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => setStep("meeting")}>
          Modifier
        </Button>
        <Button variant="primary" icon={<Send />} loading={busy} disabled={!preview || preview.blockers.length > 0} onClick={() => void send()}>
          {revision > 0 ? "Envoyer la mise à jour" : "Envoyer la convocation"}
        </Button>
      </div>
    );

  return (
    <Sheet open onClose={onClose} title={revision > 0 ? "Modifier la convocation" : "Convocation"} description={`${matchTitle(match)} · ${shortDateTime(match.startsAt, timezone)}`} footer={footer}>
      {!ready ? (
        error ? <FormMessage tone="danger">{error}</FormMessage> : <ListSkeleton rows={5} />
      ) : step === "select" ? (
        <div className="flex flex-col gap-3">
          {data.availability.roster.length === 0 ? <p className="type-meta">Aucun joueur n&apos;est rattaché à cette équipe (liste des joueurs).</p> : null}
          <ul className="flex flex-col divide-y divide-border rounded-[14px] border border-border bg-surface-raised">
            {data.availability.roster.map((r) => {
              const checked = selected.has(r.licencie.id);
              const badge = AVAILABILITY_BADGE[r.response ?? "NONE"];
              return (
                <li key={r.licencie.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3.5 py-2.5">
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-[var(--accent)]"
                      checked={checked}
                      onChange={() =>
                        setSelected((s) => {
                          const next = new Set(s);
                          if (next.has(r.licencie.id)) next.delete(r.licencie.id);
                          else next.add(r.licencie.id);
                          return next;
                        })
                      }
                    />
                    <span className={cn("min-w-0 flex-1 truncate text-[14.5px]", checked ? "font-medium text-foreground" : "text-muted")}>
                      {r.licencie.firstName} {r.licencie.lastName}
                    </span>
                    <StatusBadge size="sm" tone={badge.tone}>
                      {badge.label}
                    </StatusBadge>
                  </label>
                </li>
              );
            })}
          </ul>
          {unavailableSelected.map((r) => (
            <FormMessage key={r.licencie.id} tone="info">
              {r.licencie.firstName} a indiqué être indisponible.
            </FormMessage>
          ))}
        </div>
      ) : step === "meeting" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[14px] bg-surface-muted p-3.5 text-[14px]">
            <p className="type-meta">{match.isHome === false ? "Match à l'extérieur" : "Match à domicile"}</p>
            <p className="mt-0.5 font-medium text-foreground">
              <span className="type-numeric">{matchTime}</span>
              {match.venueName ? ` · ${match.venueName}` : ""}
            </p>
            {match.venueAddress ? <p className="type-meta">{match.venueAddress}</p> : null}
          </div>
          <Field label="Heure du rendez-vous" required>
            {(props) => (
              <div className="flex flex-col gap-2">
                <Input type="time" {...props} value={meetingTime} step={300} onChange={(e) => setMeetingTime(e.target.value)} className="max-w-40" />
                <div className="flex flex-wrap gap-2">
                  {[
                    [45, "45 min avant"],
                    [60, "1h avant"],
                    [75, "1h15 avant"],
                  ].map(([min, label]) => (
                    <Button key={label} size="sm" variant={meetingTime === minus(matchTime, Number(min)) ? "secondary" : "ghost"} onClick={() => setMeetingTime(minus(matchTime, Number(min)))}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Field>
          <Field label="Lieu du rendez-vous" required={match.isHome === false} hint={match.isHome === false ? "Exemple : Parking Maurice Clavel." : "Par défaut : le gymnase du match."}>
            {(props) => <Input {...props} value={meetingPoint} maxLength={160} onChange={(e) => setMeetingPoint(e.target.value)} placeholder={match.isHome === false ? "Point de départ" : (match.venueName ?? "")} />}
          </Field>
          <Field label="Message du coach" optional>
            {(props) => <Textarea {...props} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} placeholder="Ex. : Merci de prendre le survêtement et la tenue blanche." />}
          </Field>
          {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        </div>
      ) : !preview ? (
        error ? <FormMessage tone="danger">{error}</FormMessage> : <ListSkeleton rows={4} />
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14.5px] text-foreground">
            <span className="type-numeric font-semibold">{preview.recipientsCount}</span> joueur{preview.recipientsCount > 1 ? "s" : ""} convoqué{preview.recipientsCount > 1 ? "s" : ""}.
          </p>
          {preview.unavailableSelected.length ? (
            <FormMessage tone="info">
              {preview.unavailableSelected.join(", ")} {preview.unavailableSelected.length > 1 ? "ont" : "a"} indiqué être indisponible{preview.unavailableSelected.length > 1 ? "s" : ""}.
            </FormMessage>
          ) : null}
          {preview.blockers.map((b) => (
            <p key={b} className="flex items-start gap-2 text-[14px] font-medium text-danger [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0">
              <AlertTriangle aria-hidden />
              {b}
            </p>
          ))}
          {preview.samples.map((sample) => (
            <div key={sample.audience} className="flex flex-col gap-1.5">
              <p className="type-eyebrow">{sample.audience === "GUARDIAN" ? "Voici ce que recevra un parent" : "Voici ce que recevra un joueur majeur"}</p>
              <p className="whitespace-pre-line rounded-[14px] border border-border bg-surface-raised p-3.5 text-[14px] leading-relaxed text-foreground">{sample.text}</p>
            </div>
          ))}
          <p className="type-meta">Envoi dans l&apos;application : la convocation apparaît tout de suite sur l&apos;accueil de chaque famille.</p>
          {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        </div>
      )}
    </Sheet>
  );
}

