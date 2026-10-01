import Link from "next/link";
import { MapPin } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { TeamLogo } from "@/components/ui/Logo";
import { cn } from "@/components/ui/cn";
import type { MatchListItemDto } from "@/lib/api/matches";
import { clubSideLabel, derogationBadge, journeeLabel, matchDateParts, matchOutcome, matchStatusBadge, sideBadge } from "./match-display";

export interface MatchCardClub {
  name: string;
  logoUrl: string | null;
}

interface Side {
  name: string;
  /** Nom servant au monogramme : le club (identité) plutôt que le libellé d'équipe. */
  logoName: string;
  logoUrl: string | null;
  score: number | null;
  isClub: boolean;
}

function sides(match: MatchListItemDto, club: MatchCardClub): [Side, Side] {
  const ours: Side = { name: clubSideLabel(match, club.name), logoName: club.name, logoUrl: club.logoUrl, score: null, isClub: true };
  const theirs: Side = { name: match.opponentName ?? "Adversaire à confirmer", logoName: match.opponentName ?? "?", logoUrl: match.opponentLogoUrl, score: null, isClub: false };
  // Ordre FFBB : domicile d'abord. Côté inconnu (null) : le club d'abord, sans badge de côté.
  const [home, away] = match.isHome === false ? [theirs, ours] : [ours, theirs];
  return [
    { ...home, score: match.scoreHome },
    { ...away, score: match.scoreAway },
  ];
}

function TeamLine({ side, size, emphasis, showScore }: { side: Side; size: "sm" | "md"; emphasis: "win" | "lose" | "neutral"; showScore: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TeamLogo name={side.logoName} src={side.logoUrl} size={size === "md" ? "sm" : "xs"} accent={side.isClub} />
      <span className={cn("line-clamp-2 min-w-0 flex-1 break-words leading-tight", size === "md" ? "text-sm sm:text-[15px]" : "text-sm", emphasis === "lose" ? "text-muted" : "font-medium text-foreground")}>{side.name}</span>
      {showScore ? (
        <span className={cn("type-numeric shrink-0 tabular-nums", size === "md" ? "text-2xl" : "text-lg", emphasis === "win" ? "font-semibold text-foreground" : "text-muted")}>{side.score}</span>
      ) : null}
    </div>
  );
}

/**
 * Carte match signature (design-system/scsb/MASTER.md §9) :
 * - match à venir : l'HEURE domine (données chiffrées, rail de date à gauche) ;
 * - match joué : le SCORE domine (vainqueur en graisse forte, perdant atténué) ;
 * - domicile/extérieur : icône Maison/Route + libellé ;
 * - logos réels, monogramme en repli. Aucune donnée inventée : un champ
 *   absent affiche explicitement « à confirmer ».
 */
export function MatchCard({ match, href, club, variant = "row" }: { match: MatchListItemDto; href: string; club: MatchCardClub; variant?: "row" | "tile" }) {
  const parts = matchDateParts(match.matchDatetime);
  const played = match.scoreHome !== null && match.scoreAway !== null;
  const [home, away] = sides(match, club);
  const outcome = matchOutcome(match);
  const status = matchStatusBadge(match.status);
  const derog = derogationBadge(match.derogationStatus);
  const side = sideBadge(match.isHome);
  const journee = journeeLabel(match.journee);

  const emphasis = (s: Side): "win" | "lose" | "neutral" => {
    if (!played || home.score === away.score) return "neutral";
    const other = s === home ? away : home;
    return (s.score ?? 0) > (other.score ?? 0) ? "win" : "lose";
  };

  const badges = (
    <>
      {status ? (
        <StatusBadge tone={status.tone} icon={status.icon} size="sm">
          {status.label}
        </StatusBadge>
      ) : null}
      {derog ? (
        <StatusBadge tone={derog.tone} icon={derog.icon} size="sm">
          {derog.label}
        </StatusBadge>
      ) : null}
      {played && outcome ? (
        <StatusBadge tone={outcome === "win" ? "success" : "neutral"} size="sm">
          {outcome === "win" ? "Victoire" : outcome === "loss" ? "Défaite" : "Nul"}
        </StatusBadge>
      ) : null}
    </>
  );

  const label = `${home.name} contre ${away.name}${parts ? `, ${parts.weekday} ${parts.day} ${parts.month} à ${parts.time}` : ""}${played ? `, score ${home.score} à ${away.score}` : ""}`;

  if (variant === "tile") {
    return (
      <Link href={href} aria-label={label} data-interactive="true" className="surface-card group flex h-full min-h-[188px] flex-col gap-4 p-4">
        <div className="flex h-6 items-center justify-between gap-2">
          <p className="type-eyebrow">{parts ? `${parts.weekday} ${parts.day} ${parts.month}` : "Date à confirmer"}</p>
          {derog ? (
            <StatusBadge tone={derog.tone} icon={derog.icon} size="sm">
              {derog.label.replace("Dérog ", "")}
            </StatusBadge>
          ) : null}
        </div>
        {played ? (
          <p className="type-numeric text-[2.5rem] font-medium leading-none text-foreground">
            {home.score}
            <span className="mx-1.5 text-subtle">–</span>
            {away.score}
          </p>
        ) : (
          <p className="type-numeric text-[2.5rem] font-medium leading-none text-foreground">{parts?.time ?? "--:--"}</p>
        )}
        <div className="mt-auto flex flex-col gap-2">
          <TeamLine side={home} size="sm" emphasis={emphasis(home)} showScore={false} />
          <TeamLine side={away} size="sm" emphasis={emphasis(away)} showScore={false} />
        </div>
        {status ? (
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge tone={status.tone} icon={status.icon} size="sm">
              {status.label}
            </StatusBadge>
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <Link href={href} aria-label={label} data-interactive="true" className="surface-card group flex overflow-hidden">
      {/* Rail de date : relief en creux, jour en chiffres de données */}
      <div className={cn("flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-r border-border px-1.5 py-4 sm:w-[88px]", played ? "bg-surface" : "bg-[color-mix(in_oklab,var(--club-accent)_4%,var(--surface))]")}>
        <span className="type-eyebrow">{parts?.weekday ?? "—"}</span>
        <span className="type-numeric text-[1.75rem] font-medium leading-none text-foreground">{parts?.day ?? "--"}</span>
        <span className="type-eyebrow">{parts?.month ?? ""}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="type-eyebrow truncate" title={match.competitionName ?? undefined}>
            {[journee, match.competitionName].filter(Boolean).join(" · ") || (match.numero ? `Rencontre n° ${match.numero}` : "Championnat")}
          </p>
          {side ? (
            <StatusBadge tone={side.tone} icon={side.icon} size="sm">
              {side.label}
            </StatusBadge>
          ) : null}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <TeamLine side={home} size="md" emphasis={emphasis(home)} showScore={played} />
            <TeamLine side={away} size="md" emphasis={emphasis(away)} showScore={played} />
          </div>
          {!played ? (
            <div className="flex shrink-0 flex-col items-end border-l border-border pl-3 sm:pl-4">
              <span className="type-numeric text-2xl font-medium leading-none text-foreground sm:text-[2rem]">{parts?.time ?? "--:--"}</span>
              <span className="type-meta mt-1">{parts ? "Coup d'envoi" : "Heure à confirmer"}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="type-meta flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden className="size-3.5 shrink-0 text-subtle" />
            <span className="truncate">{match.venueLabel ?? "Lieu à confirmer"}</span>
          </span>
          <span className="flex flex-wrap gap-1.5">{badges}</span>
        </div>
      </div>
    </Link>
  );
}
