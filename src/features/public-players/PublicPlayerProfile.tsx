import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Flame, Megaphone, Shirt, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/PageHeader";
import { cn } from "@/components/ui/cn";
import { TABLE_ROLE_LABELS } from "@/features/tables/role-labels";
import type { PublicPlayerMatchDto, PublicPlayerProfileDto } from "@/lib/api/publicMatches";
import { monogram } from "@/lib/ui/accent";

/**
 * Fiche joueur PUBLIQUE (retour du club, 2026-10-08 : « nom, prénom, photo,
 * derniers matchs, équipes, nombre de tables effectuées et autres infos
 * publiques stylées, pense à l'UX »). Mobile d'abord : en-tête photo, chiffres
 * clés en 4 tuiles, prochain match, derniers matchs en liste tapable,
 * tables de marque. Uniquement des valeurs réelles de l'API — un tiret
 * quand une donnée manque, jamais une valeur inventée.
 */
export function PublicPlayerProfile({ profile, clubName, matchBasePath }: { profile: PublicPlayerProfileDto; clubName: string; matchBasePath: string }) {
  const { player, season, recentMatches, tables, nextMatch, teams } = profile;
  const fullName = `${player.firstName} ${player.lastName}`;
  const playerTeams = teams.filter((t) => t.relation === "PLAYER");
  const coachTeams = teams.filter((t) => t.relation === "COACH");
  const bestMatch = season.bestPointsMatchId ? recentMatches.find((m) => m.matchId === season.bestPointsMatchId) : undefined;

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête : photo plein cadre sur fond sombre, nom en grand. */}
      <header className="relative isolate overflow-hidden rounded-[24px] border border-border bg-[#141414] text-white shadow-2">
        <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_0%_0%,var(--club-accent)_0%,transparent_60%)] opacity-70" />
        <div className="flex flex-col items-center gap-5 px-5 pb-6 pt-8 text-center sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:pb-8 sm:text-left">
          <Portrait name={fullName} src={player.photoUrl} />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/65">{clubName}</p>
            <h1 className="leading-tight">
              <span className="block text-lg font-medium text-white/85">{player.firstName}</span>
              <span className="block break-words text-[2rem] font-bold uppercase tracking-tight sm:text-[2.5rem]">{player.lastName}</span>
            </h1>
            <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {playerTeams.map((t) => (
                <HeroChip key={`p-${t.id}`} icon={<Shirt />}>
                  {t.name}
                </HeroChip>
              ))}
              {coachTeams.map((t) => (
                <HeroChip key={`c-${t.id}`} icon={<Megaphone />}>
                  Coach {t.name}
                </HeroChip>
              ))}
              {playerTeams.length === 0 && player.categoryLabel ? <HeroChip icon={<Shirt />}>{player.categoryLabel}</HeroChip> : null}
            </div>
          </div>
        </div>
      </header>

      {/* Chiffres clés de la saison. */}
      <section aria-labelledby="saison-title" className="flex flex-col gap-3">
        <SectionHeader id="saison-title" title="Cette saison" description={season.matchesPlayed > 0 ? seasonRecord(season.wins, season.losses) : undefined} />
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <KeyFigure label="Matchs joués" value={season.matchesPlayed} />
          <KeyFigure label="Points" value={season.matchesWithStats > 0 ? season.totalPoints : null} />
          <KeyFigure label="Moy. / match" value={season.pointsPerMatch !== null ? season.pointsPerMatch.toLocaleString("fr-FR") : null} />
          <KeyFigure label="Tables faites" value={tables.done} />
        </dl>
        {season.matchesWithStats > 0 ? (
          <p className="type-meta">
            {season.threePointsMade} tir{season.threePointsMade > 1 ? "s" : ""} à 3 pts · {season.freeThrowsMade} lancer{season.freeThrowsMade > 1 ? "s" : ""} franc{season.freeThrowsMade > 1 ? "s" : ""} ·{" "}
            {formatMinutes(season.secondsPlayed)} de jeu
          </p>
        ) : null}
        {season.bestPoints !== null && season.bestPoints > 0 ? (
          <Link
            href={`${matchBasePath}/${season.bestPointsMatchId}?tab=statistiques`}
            className="surface-card group flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
              <Flame aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="type-eyebrow block">Meilleur match</span>
              <span className="block truncate text-[15px] font-medium text-foreground">
                <span className="type-numeric">{season.bestPoints} pts</span>
                {bestMatch ? ` · ${bestMatch.isHome ? "vs" : "à"} ${bestMatch.opponentName ?? "adversaire"}` : ""}
              </span>
            </span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle group-hover:text-accent-text" />
          </Link>
        ) : null}
      </section>

      {nextMatch ? (
        <section aria-labelledby="prochain-title" className="flex flex-col gap-3">
          <SectionHeader id="prochain-title" title="Prochain match" />
          <Link href={`${matchBasePath}/${nextMatch.matchId}`} className="surface-card group flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted">
            <DateBlock iso={nextMatch.matchDatetime} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-foreground">
                {nextMatch.isHome ? "vs" : "à"} {nextMatch.opponentName ?? "Adversaire à confirmer"}
              </span>
              <span className="type-meta block truncate">
                {[nextMatch.teamName, nextMatch.isHome ? "Domicile" : "Extérieur", formatTime(nextMatch.matchDatetime)].filter(Boolean).join(" · ")}
              </span>
            </span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle group-hover:text-accent-text" />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="matchs-title" className="flex flex-col gap-3">
        <SectionHeader id="matchs-title" title="Derniers matchs" />
        {recentMatches.length === 0 ? (
          <p className="surface-card type-meta p-4">Aucun match publié cette saison pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-raised shadow-1">
            {recentMatches.map((m) => (
              <li key={m.matchId}>
                <RecentMatchRow match={m} href={`${matchBasePath}/${m.matchId}?tab=statistiques`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tables-title" className="flex flex-col gap-3">
        <SectionHeader id="tables-title" title="Tables de marque" />
        <div className="surface-card flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
              <ClipboardList aria-hidden className="size-5" />
            </span>
            <p className="text-[15px] text-foreground">
              {tables.done > 0 ? (
                <>
                  <span className="type-numeric font-semibold">{tables.done}</span> table{tables.done > 1 ? "s" : ""} tenue{tables.done > 1 ? "s" : ""} cette saison
                </>
              ) : (
                "Aucune table tenue cette saison pour l'instant."
              )}
            </p>
          </div>
          {tables.byRole.length > 0 || tables.upcoming > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tables.byRole.map((r) => (
                <StatusBadge key={r.role} tone="neutral" size="sm">
                  {TABLE_ROLE_LABELS[r.role]} × {r.count}
                </StatusBadge>
              ))}
              {tables.upcoming > 0 ? (
                <StatusBadge tone="accent" size="sm" icon={<CalendarDays />}>
                  {tables.upcoming} à venir
                </StatusBadge>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Portrait({ name, src }: { name: string; src: string | null }) {
  const box = "size-32 shrink-0 rounded-[28px] border-2 border-white/15 shadow-2 sm:size-36";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- photo stockée par le club, hors domaines Next configurés
    return <img src={src} alt={`Photo de ${name}`} className={cn(box, "object-cover")} />;
  }
  return (
    <span aria-hidden className={cn(box, "flex items-center justify-center bg-white/10 text-4xl font-semibold text-white/70")}>
      {monogram(name)}
    </span>
  );
}

function HeroChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 text-xs font-medium text-white [&_svg]:size-3.5">
      {icon}
      {children}
    </span>
  );
}

function KeyFigure({ label, value }: { label: string; value: ReactNode | null }) {
  return (
    <div className="surface-card flex flex-col gap-1 p-3 sm:p-4">
      <dd className="type-numeric text-[1.75rem] font-semibold leading-none text-foreground">{value ?? "—"}</dd>
      <dt className="type-meta text-[12px]">{label}</dt>
    </div>
  );
}

const RESULT_STYLE: Record<NonNullable<PublicPlayerMatchDto["result"]>, { letter: string; label: string; className: string }> = {
  WIN: { letter: "V", label: "Victoire", className: "bg-success-soft text-success" },
  LOSS: { letter: "D", label: "Défaite", className: "bg-danger-soft text-danger" },
  DRAW: { letter: "N", label: "Match nul", className: "bg-surface-muted text-muted" },
};

function RecentMatchRow({ match, href }: { match: PublicPlayerMatchDto; href: string }) {
  const result = match.result ? RESULT_STYLE[match.result] : null;
  const score = match.scoreHome !== null && match.scoreAway !== null ? (match.isHome ? `${match.scoreHome}-${match.scoreAway}` : `${match.scoreAway}-${match.scoreHome}`) : null;
  return (
    <Link href={href} className="group flex min-h-16 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-muted">
      <span
        className={cn("type-numeric inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", result?.className ?? "bg-surface-muted text-subtle")}
        title={result?.label}
      >
        {result ? (
          <>
            <span aria-hidden>{result.letter}</span>
            <span className="sr-only">{result.label}</span>
          </>
        ) : (
          "–"
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-foreground">
          {match.isHome ? "vs" : "à"} {match.opponentName ?? "Adversaire"}
        </span>
        <span className="type-meta type-numeric block truncate text-[12.5px]">
          {[formatShortDate(match.matchDatetime), score, match.teamName, match.jerseyNumber ? `#${match.jerseyNumber}` : null, match.isCaptain ? "Capitaine" : null].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="type-numeric text-2xl font-semibold leading-none text-foreground">{match.points ?? "—"}</span>
        <span className="type-meta text-[11px]">{match.secondsPlayed !== null ? `pts · ${formatMinutes(match.secondsPlayed)}` : "pts"}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle group-hover:text-accent-text" />
    </Link>
  );
}

function DateBlock({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-accent-text">
        <Trophy aria-hidden className="size-5" />
      </span>
    );
  }
  const d = new Date(iso);
  const day = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit" });
  const month = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", month: "short" }).replace(".", "");
  const weekday = d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "short" }).replace(".", "");
  return (
    <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-[14px] bg-accent-soft leading-none text-accent-text">
      <span className="text-[10px] font-medium uppercase">{weekday}</span>
      <span className="type-numeric text-xl font-bold">{day}</span>
      <span className="text-[10px] font-medium uppercase">{month}</span>
    </span>
  );
}

function seasonRecord(wins: number, losses: number): string {
  return `${wins} victoire${wins > 1 ? "s" : ""} · ${losses} défaite${losses > 1 ? "s" : ""}`;
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function formatShortDate(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "short" }) : null;
}

function formatTime(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }) : null;
}
