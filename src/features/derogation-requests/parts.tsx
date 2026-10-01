import type { ReactNode } from "react";
import { Home, Plane } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/cn";
import type { DerogationMatchRefDto, DerogationRequestStatus } from "@/lib/api/derogationRequests";
import { STATUS_META, formatShortDateTime, teamLabel } from "./labels";

export function RequestStatusBadge({ status, size = "md" }: { status: DerogationRequestStatus; size?: "sm" | "md" }) {
  const meta = STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} size={size}>
      {meta.label}
    </StatusBadge>
  );
}

export function HomeAwayTag({ isHome }: { isHome: boolean | null }) {
  if (isHome === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted [&_svg]:size-3.5">
      {isHome ? <Home aria-hidden /> : <Plane aria-hidden />}
      {isHome ? "Domicile" : "Extérieur"}
    </span>
  );
}

/** « U15F · vs Montpellier » + date actuelle (fuseau du club). */
export function MatchHeadline({ match, timezone, className, trailing }: { match: DerogationMatchRefDto; timezone: string; className?: string; trailing?: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex h-6 items-center rounded-md bg-accent-soft px-2 text-[12px] font-semibold text-accent-text">{teamLabel(match)}</span>
        <span className="min-w-0 truncate text-[15px] font-medium text-foreground">{match.opponentName ? `vs ${match.opponentName}` : "Adversaire à confirmer"}</span>
        {trailing}
      </div>
      <p className="type-meta flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="type-numeric">{formatShortDateTime(match.matchDatetime, timezone)}</span>
        <HomeAwayTag isHome={match.isHome} />
        {match.venueName ? <span className="truncate">{match.venueName}</span> : null}
      </p>
    </div>
  );
}
