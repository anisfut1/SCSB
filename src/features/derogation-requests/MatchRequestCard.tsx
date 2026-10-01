import { CalendarClock, CalendarPlus, MessageSquare, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import type { DerogationRequestSummaryDto } from "@/lib/api/derogationRequests";
import { formatDayLongCapitalized, formatRelative, formatTime, isActive } from "./labels";
import { RequestStatusBadge } from "./parts";

/**
 * Bloc « Demande de dérogation » de la fiche match (demande INTERNE coach →
 * coordinateur), affiché séparément du statut officiel FBI. N'affiche que
 * des données réelles : rien si aucune demande et aucun droit d'en créer.
 */
export function MatchRequestCard({
  requests,
  canCreate,
  timezone,
  basePath,
  matchId,
}: {
  requests: DerogationRequestSummaryDto[];
  canCreate: boolean;
  timezone: string;
  basePath: string;
  matchId: string;
}) {
  const current = requests.find((r) => isActive(r.status)) ?? requests[0] ?? null;
  if (!current && !canCreate) return null;
  const newHref = `${basePath}/nouvelle?match=${matchId}`;

  if (!current) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader icon={<CalendarClock />} title="Demande de dérogation" description="Besoin de déplacer ce match ? Choisis une date et un créneau libre : le coordinateur du club reçoit ta demande." />
        <ButtonLink href={newHref} variant="primary" icon={<CalendarPlus />} className="self-start">
          Demander une dérogation
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader icon={<CalendarClock />} title="Demande de dérogation" description="Demande interne au club — le calendrier officiel n'est pas modifié automatiquement." actions={<RequestStatusBadge status={current.status} size="sm" />} />
      <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] border border-border bg-surface p-3.5">
        <p className="type-eyebrow">Créneau demandé</p>
        <p className="type-numeric text-[15px] font-semibold text-foreground">
          {formatDayLongCapitalized(current.requestedStartAt, timezone)} · {formatTime(current.requestedStartAt, timezone)} → {formatTime(current.requestedEndAt, timezone)}
        </p>
        <p className="type-meta">{current.requestedVenue?.name ?? "À l'extérieur — à confirmer avec le club adverse"}</p>
        <p className="type-meta flex items-center gap-1">
          <UserRound aria-hidden className="size-3.5" />
          Demande formulée par : <span className="font-medium text-foreground">{current.requesterDisplayName}</span>
        </p>
      </div>
      {current.lastMessage ? (
        <p className="flex items-start gap-2 text-[13px] text-muted">
          <MessageSquare aria-hidden className="mt-0.5 size-3.5 shrink-0 text-subtle" />
          <span className="text-reflow min-w-0 flex-1">
            {current.lastMessage.type === "USER" ? <span className="font-medium text-foreground">{current.lastMessage.authorDisplayName} : </span> : null}
            {current.lastMessage.excerpt}
          </span>
          <span className="type-numeric shrink-0 text-[12px] text-subtle">{formatRelative(current.lastMessageAt, new Date(), timezone)}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <ButtonLink href={`${basePath}/${current.id}`} variant="secondary" icon={<MessageSquare />}>
          Voir la conversation
        </ButtonLink>
        {!isActive(current.status) && canCreate ? (
          <ButtonLink href={newHref} variant="ghost" icon={<CalendarPlus />}>
            Nouvelle demande
          </ButtonLink>
        ) : null}
      </div>
    </Card>
  );
}
