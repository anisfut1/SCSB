"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, ClipboardCheck, Dumbbell, MapPin, UserPlus } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { publicTeamLife, type ActionCenterActionDto, type ActionCenterDto, type ConvocationResponseValue, type MatchAvailabilityValue, type TrainingResponseValue } from "@/lib/api/teamLife";
import { getDeviceTokens, removeDeviceTokens } from "@/lib/publicToken";
import { countsSummary, locationLabel, relativeDay, timeOf } from "./labels";
import { AvailabilityCard, CoachMatchCard, ConvocationCard, type AvailabilityAction, type ConvocationAction } from "./MatchActionCards";
import { ResponseButtons } from "./ResponseButtons";

type ResponseAction = Extract<ActionCenterActionDto, { type: "TRAINING_RESPONSE" }>;
type CoachAction = Extract<ActionCenterActionDto, { type: "COACH_TRAINING_SUMMARY" }>;

/**
 * Home « À faire » (Vie d'équipe, Lot 1) : ce que le parent / joueur / coach
 * doit faire MAINTENANT, avant tout le reste — « Lina — entraînement mardi
 * 19h [Présente] [Absente] [Incertaine] », un clic, terminé. Tous les liens
 * de l'appareil sont fusionnés (un par enfant). Réponse optimiste : l'état
 * change tout de suite, et revient en arrière avec un message si l'envoi
 * échoue.
 */
/**
 * Chargement de la Home « À faire » : tous les liens de l'appareil (un par
 * enfant). Partagé par le bloc « À faire » et « Mon agenda » de l'accueil.
 */
export function useActionCenter(clubSlug: string, activeToken: string): { data: ActionCenterDto | null; tokens: string[]; failed: boolean } {
  const [state, setState] = useState<{ data: ActionCenterDto | null; tokens: string[]; failed: boolean }>({ data: null, tokens: [], failed: false });
  useEffect(() => {
    let cancelled = false;
    const deviceTokens = [...new Set([activeToken, ...getDeviceTokens(clubSlug)])];
    publicTeamLife
      .actionCenter(clubSlug, deviceTokens)
      .then((result) => {
        if (cancelled) return;
        // Liens révoqués : oubliés sur cet appareil, sans bloquer les autres.
        if (result.invalidTokenIndexes.length) removeDeviceTokens(clubSlug, result.invalidTokenIndexes.map((i) => deviceTokens[i]!).filter(Boolean));
        setState({ data: result, tokens: deviceTokens, failed: false });
      })
      .catch(() => !cancelled && setState({ data: null, tokens: [], failed: true }));
    return () => {
      cancelled = true;
    };
  }, [clubSlug, activeToken]);
  return state;
}

/**
 * Home « À faire » (Vie d'équipe, Lot 1) : ce que le parent / joueur / coach
 * doit faire MAINTENANT, avant tout le reste — « Lina — entraînement mardi
 * 19h [Présente] [Absente] [Incertaine] », un clic, terminé. Réponse
 * optimiste : l'état change tout de suite, et revient en arrière avec un
 * message si l'envoi échoue. « Ajouter un enfant » seulement quand c'est
 * plausible (homonyme de nom de famille au club, ou déjà plusieurs enfants).
 */
export function ActionCenter({ clubSlug, timezone, data, tokens, failed, onAddPerson }: { clubSlug: string; timezone: string; data: ActionCenterDto | null; tokens: string[]; failed: boolean; onAddPerson: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((next: { tone: "success" | "danger"; message: string }) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  /** Réponse optimiste avec le lien de l'enfant concerné ; retour en arrière + message si l'envoi échoue. */
  const respond = useCallback(
    async (action: AnswerableAction, value: string, send: (token: string) => Promise<unknown>) => {
      if (!data) return;
      const key = keyOf(action);
      const person = data.people.find((p) => p.licencieId === action.licencieId);
      const token = person ? tokens[person.tokenIndex] : undefined;
      if (!token) return;
      const previous = key in answers ? answers[key]! : action.currentResponse;
      setAnswers((a) => ({ ...a, [key]: value }));
      setSaving((s) => ({ ...s, [key]: true }));
      try {
        await send(token);
      } catch {
        setAnswers((a) => ({ ...a, [key]: previous }));
        showToast({ tone: "danger", message: "Impossible d'enregistrer la réponse." });
      } finally {
        setSaving((s) => ({ ...s, [key]: false }));
      }
    },
    [answers, data, showToast, tokens],
  );

  if (failed) return null; // La Home reste utilisable : le reste de l'accueil s'affiche normalement.
  if (!data) {
    return (
      <section aria-label="À faire" className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-36 w-full rounded-[18px]" />
      </section>
    );
  }

  const current = (a: AnswerableAction): string | null => {
    const key = keyOf(a);
    return key in answers ? answers[key]! : a.currentResponse;
  };
  // Ordre de l'API (réponses attendues, convocations, coach, le reste). « À faire » = sans réponse au
  // chargement : une réponse donnée ici reste en place, cochée, jusqu'au prochain passage.
  const answerable = data.actions.filter(isAnswerable);
  const todo = answerable.filter(isTodo);
  const answered = answerable.filter((a) => !isTodo(a));
  const coach = data.actions.filter((a) => a.type === "COACH_TRAINING_SUMMARY" || a.type === "COACH_MATCH");
  const remaining = todo.filter((a) => current(a) === null || current(a) === "PENDING").length;
  const several = data.people.length > 1;

  const renderAction = (a: AnswerableAction, compact = false) => {
    const key = keyOf(a);
    const busy = saving[key] === true;
    if (a.type === "TRAINING_RESPONSE") {
      return <TrainingResponseCard action={a} timezone={timezone} value={current(a) as TrainingResponseValue | null} saving={busy} showTeam={several} compact={compact} onRespond={(v) => void respond(a, v, (token) => publicTeamLife.respond(clubSlug, token, a.training.id, v))} />;
    }
    if (a.type === "MATCH_AVAILABILITY") {
      return <AvailabilityCard action={a} timezone={timezone} value={current(a) as MatchAvailabilityValue | null} saving={busy} compact={compact} onRespond={(v) => void respond(a, v, (token) => publicTeamLife.respondAvailability(clubSlug, token, a.match.id, v))} />;
    }
    return <ConvocationCard action={a} timezone={timezone} value={(current(a) ?? "PENDING") as ConvocationResponseValue} saving={busy} onRespond={(v) => void respond(a, v, (token) => publicTeamLife.respondConvocation(clubSlug, token, a.match.id, v))} />;
  };

  return (
    <section aria-labelledby="todo-title" className="flex flex-col gap-4">
      <SectionHeader
        id="todo-title"
        title="À faire"
        description={several ? `Pour ${data.people.map((p) => p.firstName).join(", ")}.` : undefined}
        action={
          data.canAddRelative ? (
            <Button variant="ghost" size="sm" icon={<UserPlus />} onClick={onAddPerson}>
              Ajouter un enfant
            </Button>
          ) : null
        }
      />

      {todo.length === 0 && coach.length === 0 ? (
        <Card className="flex items-center gap-3">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success [&_svg]:size-5">
            <CheckCircle2 />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground">Tout est à jour</p>
            <p className="type-meta">{answerable.length ? "Tu as répondu à tout ce qui était demandé." : "Aucune réponse attendue pour le moment."}</p>
          </div>
        </Card>
      ) : null}

      {todo.length ? (
        <ul className="flex flex-col gap-3">
          {todo.map((a) => (
            <li key={keyOf(a)}>{renderAction(a)}</li>
          ))}
        </ul>
      ) : null}
      {todo.length > 0 && remaining === 0 ? (
        <p role="status" className="flex items-center gap-2 text-[14px] font-medium text-success [&_svg]:size-4">
          <CheckCircle2 aria-hidden /> Merci, tout est à jour.
        </p>
      ) : null}

      {coach.length ? (
        <ul className="flex flex-col gap-3">
          {coach.map((a) =>
            a.type === "COACH_TRAINING_SUMMARY" ? (
              <li key={`coach-${a.training.id}`}>
                <CoachSummaryCard action={a} timezone={timezone} href={`/public/${clubSlug}/entrainements?equipe=${a.training.team.id}&seance=${a.training.id}`} />
              </li>
            ) : a.type === "COACH_MATCH" ? (
              <li key={`coach-m-${a.match.id}`}>
                <CoachMatchCard action={a} timezone={timezone} href={`/public/${clubSlug}/matchs/${a.match.id}#vie-equipe`} />
              </li>
            ) : null,
          )}
        </ul>
      ) : null}

      {answered.length ? (
        <details className="group rounded-[16px] border border-border bg-surface-raised">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-[14px] font-medium text-foreground">
            <span className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-success">
              <CalendarCheck2 aria-hidden />
              Déjà répondu ({answered.length})
            </span>
            <span className="type-meta group-open:hidden">Modifier</span>
          </summary>
          <ul className="flex flex-col gap-3 border-t border-border p-3">
            {answered.map((a) => (
              <li key={keyOf(a)}>{renderAction(a, true)}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {toast ? <Toast tone={toast.tone} message={toast.message} /> : null}
    </section>
  );
}

type AnswerableAction = ResponseAction | AvailabilityAction | ConvocationAction;

function isAnswerable(a: ActionCenterActionDto): a is AnswerableAction {
  return a.type === "TRAINING_RESPONSE" || a.type === "MATCH_AVAILABILITY" || a.type === "CONVOCATION_RESPONSE";
}

function isTodo(a: AnswerableAction): boolean {
  if (a.type === "CONVOCATION_RESPONSE") return a.currentResponse === "PENDING" && !a.matchClosed;
  return a.currentResponse === null;
}

function keyOf(a: AnswerableAction): string {
  if (a.type === "TRAINING_RESPONSE") return `T:${a.training.id}:${a.licencieId}`;
  return `${a.type === "MATCH_AVAILABILITY" ? "A" : "C"}:${a.match.id}:${a.licencieId}`;
}

function TrainingResponseCard({ action, timezone, value, saving, showTeam, onRespond, compact }: { action: ResponseAction; timezone: string; value: TrainingResponseValue | null; saving: boolean; showTeam: boolean; onRespond: (v: TrainingResponseValue) => void; compact?: boolean }) {
  const t = action.training;
  const place = locationLabel(t.location);
  const Wrapper = compact ? "div" : Card;
  return (
    <Wrapper className={compact ? "flex flex-col gap-3" : "flex flex-col gap-3.5"}>
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-accent-soft text-accent-text [&_svg]:size-5">
          <Dumbbell />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-reflow text-[15.5px] font-semibold leading-snug text-foreground">
            {action.firstName} — entraînement {relativeDay(t.startsAt, timezone)} <span className="type-numeric">{timeOf(t.startsAt, timezone)}</span>
          </p>
          <p className="type-meta mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {showTeam ? <span>{t.team.name}</span> : null}
            <span className="type-numeric">
              {timeOf(t.startsAt, timezone)}–{timeOf(t.endsAt, timezone)}
            </span>
            {place ? (
              <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5">
                <MapPin aria-hidden />
                <span className="truncate">{place}</span>
              </span>
            ) : null}
            {t.isModified ? (
              <StatusBadge size="sm" tone="warning">
                Horaire modifié
              </StatusBadge>
            ) : null}
          </p>
        </div>
      </div>
      <ResponseButtons value={value} onChange={onRespond} disabled={saving} label={`Réponse pour ${action.firstName}`} />
    </Wrapper>
  );
}

function CoachSummaryCard({ action, timezone, href }: { action: CoachAction; timezone: string; href: string }) {
  const t = action.training;
  const counts = t.counts;
  return (
    <Link href={href} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
      <Card variant="interactive" className="flex items-center gap-3">
        <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-info-soft text-info [&_svg]:size-5">
          <ClipboardCheck />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-reflow text-[15px] font-semibold text-foreground">
            {t.team.name} — entraînement {relativeDay(t.startsAt, timezone)} <span className="type-numeric">{timeOf(t.startsAt, timezone)}</span>
          </p>
          <p className="type-meta mt-0.5">{counts ? countsSummary(counts) : "Réponses de l'équipe"}</p>
        </div>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-subtle" />
      </Card>
    </Link>
  );
}
