"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Ban, Check, ClipboardList, Megaphone, MapPin, Trophy, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ActionCenterActionDto, ConvocationResponseValue, MatchAvailabilityValue, TeamLifeMatchDto } from "@/lib/api/teamLife";
import { availabilitySummary, convocationSummary, matchTitle, shortDateTime, timeOf } from "./labels";
import { AvailabilityButtons, ChoiceButtons } from "./ResponseButtons";

export type AvailabilityAction = Extract<ActionCenterActionDto, { type: "MATCH_AVAILABILITY" }>;
export type ConvocationAction = Extract<ActionCenterActionDto, { type: "CONVOCATION_RESPONSE" }>;
export type CoachMatchAction = Extract<ActionCenterActionDto, { type: "COACH_MATCH" }>;

function MatchLine({ match, timezone }: { match: TeamLifeMatchDto; timezone: string }) {
  return (
    <p className="type-meta mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="type-numeric">{shortDateTime(match.startsAt, timezone)}</span>
      <span>{match.isHome === false ? "Extérieur" : match.isHome ? "Domicile" : null}</span>
      {match.venueName ? (
        <span className="inline-flex min-w-0 items-center gap-1 [&_svg]:size-3.5">
          <MapPin aria-hidden />
          <span className="truncate">{match.venueName}</span>
        </span>
      ) : null}
    </p>
  );
}

function Icon({ tone, children }: { tone: "accent" | "info" | "warning"; children: React.ReactNode }) {
  const cls = tone === "accent" ? "bg-accent-soft text-accent-text" : tone === "info" ? "bg-info-soft text-info" : "bg-warning-soft text-warning";
  return (
    <span aria-hidden className={`mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] [&_svg]:size-5 ${cls}`}>
      {children}
    </span>
  );
}

/** « Lina est-elle disponible ? » — Disponible / Indisponible / Incertain·e (ce n'est pas une convocation). */
export function AvailabilityCard({ action, timezone, value, saving, onRespond, compact }: { action: AvailabilityAction; timezone: string; value: MatchAvailabilityValue | null; saving: boolean; onRespond: (v: MatchAvailabilityValue) => void; compact?: boolean }) {
  const Wrapper = compact ? "div" : Card;
  return (
    <Wrapper className="flex flex-col gap-3.5">
      <div className="flex items-start gap-3">
        <Icon tone="accent">
          <Trophy />
        </Icon>
        <div className="min-w-0 flex-1">
          <p className="type-eyebrow">Match · disponibilité</p>
          <p className="text-reflow text-[15.5px] font-semibold leading-snug text-foreground">{matchTitle(action.match)}</p>
          <MatchLine match={action.match} timezone={timezone} />
          <p className="mt-2 text-[14px] font-medium text-foreground">{action.firstName} est disponible pour ce match ?</p>
        </div>
      </div>
      <AvailabilityButtons value={value} onChange={onRespond} disabled={saving} label={`Disponibilité de ${action.firstName}`} />
    </Wrapper>
  );
}

/**
 * Convocation : ce qui a été ENVOYÉ (photo du match, rendez-vous, message du
 * coach), et « Je confirme » / « Je ne peux pas venir » en un clic, sans page
 * intermédiaire. Match annulé / reporté : plus de bouton.
 */
export function ConvocationCard({ action, timezone, value, saving, onRespond }: { action: ConvocationAction; timezone: string; value: ConvocationResponseValue; saving: boolean; onRespond: (v: "CONFIRMED" | "DECLINED") => void }) {
  const c = action.convocation;
  const snap = c.matchSnapshot;
  // Majeur : « Bonjour Anis, » (le message est rendu par l'API) → réponse à la 1re personne.
  const adult = c.message.startsWith(`Bonjour ${action.firstName},`);
  const away = snap.isHome === false;
  return (
    <Card className="flex flex-col gap-3.5 border-accent-border">
      <div className="flex items-start gap-3">
        <Icon tone="accent">
          <Megaphone />
        </Icon>
        <div className="min-w-0 flex-1">
          <p className="type-eyebrow text-accent-text">Convocation{adult ? "" : ` · ${action.firstName}`}</p>
          <p className="text-reflow text-[15.5px] font-semibold leading-snug text-foreground">{snap.opponent ? `${snap.teamName} contre ${snap.opponent}` : snap.teamName}</p>
          <p className="type-meta type-numeric mt-0.5">{shortDateTime(snap.startsAt, timezone)}</p>
        </div>
        {action.matchClosed ? (
          <StatusBadge size="sm" tone="danger" icon={<Ban />}>
            Match annulé ou indisponible
          </StatusBadge>
        ) : null}
      </div>

      <dl className="grid gap-3 rounded-[14px] bg-surface-muted p-3.5 text-[14px] sm:grid-cols-2">
        <div>
          <dt className="type-meta">Rendez-vous</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {c.meetingAt ? <span className="type-numeric">{timeOf(c.meetingAt, timezone)}</span> : null}
            {c.meetingPoint ? <span className="block">{c.meetingPoint}</span> : null}
          </dd>
        </div>
        {away || (snap.venueName && snap.venueName !== c.meetingPoint) ? (
          <div>
            <dt className="type-meta">Lieu du match</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {snap.venueName ?? "À confirmer"}
              {snap.venueAddress ? <span className="type-meta block font-normal">{snap.venueAddress}</span> : null}
            </dd>
          </div>
        ) : null}
        {c.coachMessage ? (
          <div className="sm:col-span-2">
            <dt className="type-meta">Message du coach</dt>
            <dd className="mt-0.5 text-foreground">« {c.coachMessage} »</dd>
          </div>
        ) : null}
      </dl>

      {action.matchClosed ? null : (
        <ChoiceButtons
          choices={[
            { value: "CONFIRMED", label: "Je confirme", icon: <Check />, tone: "success" },
            { value: "DECLINED", label: adult ? "Je ne peux pas venir" : `${action.firstName} ne pourra pas venir`, icon: <X />, tone: "danger" },
          ]}
          value={value === "PENDING" ? null : value}
          onChange={onRespond}
          disabled={saving}
          label={`Convocation de ${action.firstName}`}
        />
      )}
      <details className="text-[13.5px]">
        <summary className="cursor-pointer text-muted hover:text-foreground">Voir le message complet</summary>
        <p className="mt-2 whitespace-pre-line rounded-[12px] border border-border p-3 text-foreground">{c.message}</p>
      </details>
    </Card>
  );
}

const STAGE: Record<CoachMatchAction["stage"], string> = {
  ASK_AVAILABILITY: "Demander les disponibilités",
  PREPARE_CONVOCATION: "Préparer la convocation",
  CONVOCATION_SENT: "Suivre les confirmations",
};

/** Coach : l'étape suivante de chaque match proche, en un coup d'œil. */
export function CoachMatchCard({ action, timezone, href }: { action: CoachMatchAction; timezone: string; href: string }) {
  const summary =
    action.stage === "CONVOCATION_SENT" && action.convocationCounts
      ? convocationSummary(action.convocationCounts)
      : action.stage === "PREPARE_CONVOCATION" && action.availabilityCounts
        ? availabilitySummary(action.availabilityCounts)
        : "Les disponibilités ne sont pas encore demandées.";
  return (
    <Link href={href} className="block rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
      <Card variant="interactive" className="flex items-center gap-3">
        <Icon tone={action.matchChanged || (action.convocationCounts?.declined ?? 0) > 0 ? "warning" : "info"}>
          {action.matchChanged ? <AlertTriangle /> : <ClipboardList />}
        </Icon>
        <div className="min-w-0 flex-1">
          <p className="type-eyebrow">{STAGE[action.stage]}</p>
          <p className="text-reflow text-[15px] font-semibold text-foreground">{matchTitle(action.match)}</p>
          <p className="type-meta mt-0.5">
            <span className="type-numeric">{shortDateTime(action.match.startsAt, timezone)}</span> · {summary}
          </p>
          {action.matchChanged ? <p className="mt-1 text-[13px] font-medium text-warning">Le match a été modifié depuis l&apos;envoi de la convocation.</p> : null}
        </div>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-subtle" />
      </Card>
    </Link>
  );
}
