import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { SectionHeader } from "@/components/ui/PageHeader";
import { cn } from "@/components/ui/cn";
import { MatchCard, type MatchCardClub } from "@/features/matches/MatchCard";
import { matchOutcome } from "@/features/matches/match-display";
import { StandingsTable } from "./StandingsTable";
import { clubStandingRow, type ResultGroup } from "./result-groups";

function ordinal(position: number): string {
  return position === 1 ? "1er" : `${position}e`;
}

function recordLabel(record: ResultGroup["record"]): string {
  const parts = [`${record.won} V`, `${record.lost} D`];
  if (record.draw > 0) parts.push(`${record.draw} N`);
  return parts.join(" · ");
}

/**
 * Onglet « Résultats » de l'espace public (retour du club, 2026-10-01) :
 * résultats déjà connus par équipe/catégorie + classement FFBB. Rendu
 * serveur, filtres par lien (`?equipe=`) — partageable, sans état client.
 */
export function ResultsView({ groups, selectedKey, basePath, matchBasePath, club }: { groups: ResultGroup[]; selectedKey: string | null; basePath: string; matchBasePath: string; club: MatchCardClub }) {
  if (groups.length === 0) {
    return <EmptyState icon={<Trophy />} title="Aucun résultat pour l'instant" description="Les scores et classements apparaissent ici dès qu'ils sont publiés par la FFBB." />;
  }

  const selected = selectedKey ? (groups.find((g) => g.key === selectedKey) ?? null) : null;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Équipes" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip href={basePath} active={selected === null}>
          Toutes
        </Chip>
        {groups.map((group) => (
          <Chip key={group.key} href={`${basePath}?equipe=${group.key}`} active={selected?.key === group.key}>
            {group.label}
          </Chip>
        ))}
      </nav>

      {selected ? <GroupDetail group={selected} matchBasePath={matchBasePath} club={club} /> : <Overview groups={groups} basePath={basePath} />}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-[10px] border px-3 text-[13px] font-medium transition-[background-color,border-color,box-shadow,color] duration-150",
        active ? "border-accent-border bg-accent-soft text-accent-text shadow-glow-xs" : "border-border bg-surface-raised text-muted shadow-1 hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Overview({ groups, basePath }: { groups: ResultGroup[]; basePath: string }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const pool = group.standings[0] ?? null;
        const ours = pool ? clubStandingRow(pool) : null;
        const last = group.results[0] ?? null;
        const outcome = last ? matchOutcome(last) : null;
        const ourScore = last ? (last.isHome === false ? last.scoreAway : last.scoreHome) : null;
        const theirScore = last ? (last.isHome === false ? last.scoreHome : last.scoreAway) : null;
        return (
          <li key={group.key}>
            <Link href={`${basePath}?equipe=${group.key}`} scroll={false} className="surface-card group flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] duration-150 hover:border-border-strong">
              <div className="flex items-start justify-between gap-3">
                <div className="text-reflow">
                  <p className="type-card text-foreground">{group.label}</p>
                  {group.competitionName ? <p className="type-meta line-clamp-1">{group.competitionName}</p> : null}
                </div>
                {ours?.position != null ? (
                  <span className="type-numeric shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-text">
                    {ordinal(ours.position)}
                    {pool ? <span className="font-normal opacity-80"> / {pool.rows.length}</span> : null}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                {group.results.length > 0 ? <span className="type-numeric">{recordLabel(group.record)}</span> : <span>Pas encore de résultat</span>}
                {ours?.points != null ? <span className="type-numeric">{ours.points} pts</span> : null}
              </div>
              {last ? (
                <p className="flex min-w-0 items-center gap-2 border-t border-border pt-3 text-[13px]">
                  <span
                    aria-label={outcome === "win" ? "Victoire" : outcome === "loss" ? "Défaite" : "Nul"}
                    className={cn(
                      "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      outcome === "win" ? "bg-success-soft text-success" : outcome === "loss" ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted",
                    )}
                  >
                    {outcome === "win" ? "V" : outcome === "loss" ? "D" : "N"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">{last.isHome === false ? "à" : "vs"} {last.opponentName ?? "?"}</span>
                  <span className="type-numeric shrink-0 font-medium text-foreground">
                    {ourScore} – {theirScore}
                  </span>
                </p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-accent-text">
                Classement et résultats <ArrowRight aria-hidden className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function GroupDetail({ group, matchBasePath, club }: { group: ResultGroup; matchBasePath: string; club: MatchCardClub }) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        {group.standings.length === 0 ? (
          <EmptyState compact title="Classement pas encore disponible" description="Il apparaîtra ici à la prochaine synchronisation FFBB." />
        ) : (
          group.standings.map((pool) => <StandingsTable key={pool.poolId} pool={pool} clubLogoUrl={club.logoUrl} />)
        )}
      </div>
      <div className="flex flex-col gap-4">
        <SectionHeader title="Derniers résultats" description={group.results.length > 0 ? recordLabel(group.record) : undefined} />
        {group.results.length === 0 ? (
          <EmptyState compact icon={<Trophy />} title="Pas encore de résultat" description="Les scores apparaissent dès qu'ils sont publiés par la FFBB." />
        ) : (
          <ul className="flex flex-col gap-3">
            {group.results.map((match) => (
              <li key={match.id}>
                <MatchCard match={match} href={`${matchBasePath}/${match.id}`} club={club} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
