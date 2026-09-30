import { CalendarDays, Clock, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { TeamLogo } from "@/components/ui/Logo";
import { cn } from "@/components/ui/cn";
import type { MatchDetailsDto } from "@/lib/api/matches";
import { formatMatchLongDate, journeeLabel, matchDateParts, matchOutcome, matchStatusBadge, sideBadge } from "../match-display";

export interface ScoreboardTeam {
  name: string;
  logoUrl: string | null;
  isClub: boolean;
}

function TeamColumn({ team, align, sideLabel, dim }: { team: ScoreboardTeam; align: "start" | "end"; sideLabel: string; dim: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:gap-4", align === "end" ? "sm:flex-row-reverse sm:text-right" : "sm:text-left")}>
      <TeamLogo name={team.name} src={team.logoUrl} size="lg" accent={team.isClub} className="sm:size-16" />
      <div className="text-reflow flex min-w-0 flex-col gap-1">
        <p className="type-eyebrow">{sideLabel}</p>
        <p className={cn("text-[15px] font-semibold leading-tight sm:text-lg", dim ? "text-muted" : "text-foreground")}>{team.name}</p>
      </div>
    </div>
  );
}

/**
 * Scoreboard de la fiche match : score dominant si joué, heure dominante
 * sinon. Carte « glow » avec motif de terrain en overlay décoratif.
 */
export function Scoreboard({ match, home, away }: { match: MatchDetailsDto; home: ScoreboardTeam; away: ScoreboardTeam }) {
  const played = match.scoreHome !== null && match.scoreAway !== null;
  const parts = matchDateParts(match.matchDatetime);
  const longDate = formatMatchLongDate(match.matchDatetime);
  const status = matchStatusBadge(match.status);
  const side = sideBadge(match.isHome);
  const outcome = matchOutcome(match);
  const journee = journeeLabel(match.journee);
  const homeWon = played && (match.scoreHome ?? 0) > (match.scoreAway ?? 0);
  const awayWon = played && (match.scoreAway ?? 0) > (match.scoreHome ?? 0);

  return (
    <section aria-label="Tableau de marque" data-glow="true" className="surface-card overflow-hidden">
      <div aria-hidden className="court-pattern pointer-events-none absolute inset-0 -z-10 opacity-70" />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <p className="type-eyebrow">{[journee, match.numero ? `Rencontre n° ${match.numero}` : null].filter(Boolean).join(" · ") || "Rencontre"}</p>
        <div className="flex flex-wrap gap-1.5">
          {side ? (
            <StatusBadge tone={side.tone} icon={side.icon} size="sm">
              {side.label}
            </StatusBadge>
          ) : null}
          {status ? (
            <StatusBadge tone={status.tone} icon={status.icon} size="sm">
              {status.label}
            </StatusBadge>
          ) : null}
          {played && outcome ? (
            <StatusBadge tone={outcome === "win" ? "success" : "neutral"} size="sm">
              {outcome === "win" ? "Victoire" : outcome === "loss" ? "Défaite" : "Nul"}
            </StatusBadge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-6 sm:gap-6 sm:px-8 sm:py-10">
        <TeamColumn team={home} align="start" sideLabel="Domicile" dim={awayWon} />
        <div className="flex flex-col items-center gap-2 px-1">
          {played ? (
            <p className="type-numeric flex items-baseline gap-2 text-[2.5rem] font-medium leading-none sm:gap-3 sm:text-[4rem]">
              <span className={homeWon || !awayWon ? "text-foreground" : "text-muted"}>{match.scoreHome}</span>
              <span className="text-2xl text-subtle sm:text-4xl">–</span>
              <span className={awayWon || !homeWon ? "text-foreground" : "text-muted"}>{match.scoreAway}</span>
            </p>
          ) : (
            <p className="type-numeric text-[2.5rem] font-medium leading-none text-foreground sm:text-[4rem]">{parts?.time ?? "--:--"}</p>
          )}
          <p className="type-eyebrow">{played ? "Score final" : parts ? "Coup d'envoi" : "Horaire à confirmer"}</p>
        </div>
        <TeamColumn team={away} align="end" sideLabel="Extérieur" dim={homeWon} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] px-4 py-3 text-[13px] text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:px-6">
        <span className="flex items-center gap-2">
          <CalendarDays aria-hidden className="size-4 text-subtle" />
          <span className="first-letter:uppercase">{longDate ?? "Date à confirmer"}</span>
        </span>
        {parts ? (
          <span className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 text-subtle" />
            {parts.time}
          </span>
        ) : null}
        <span className="flex min-w-0 items-center gap-2">
          <MapPin aria-hidden className="size-4 shrink-0 text-subtle" />
          <span className="truncate">{match.venueLabel ?? "Lieu à confirmer"}</span>
        </span>
      </div>
    </section>
  );
}
