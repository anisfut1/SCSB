import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, ClipboardList, Trophy } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/components/ui/cn";
import type { TableLeaderboardDto, TableLeaderboardEntryDto } from "@/lib/api/publicTables";
import { monogram } from "@/lib/ui/accent";
import { TABLE_ROLE_LABELS } from "./role-labels";

/**
 * Classement des tables de marque (retour du club, 2026-10-08 : « visible de
 * tous, top 3 en surbrillance avec leur tête »). Podium pour le top 3
 * (1er au centre, plus grand), puis la liste. Ex æquo = même rang, donné
 * par l'API. `playerBasePath` : lien vers la fiche joueur (publique ou club).
 */
const MEDAL: Record<number, { ring: string; badge: string; label: string }> = {
  1: { ring: "ring-[#E7B416]", badge: "bg-[#E7B416] text-[#3a2c00]", label: "Or" },
  2: { ring: "ring-[#A9B1BB]", badge: "bg-[#A9B1BB] text-[#1d2228]", label: "Argent" },
  3: { ring: "ring-[#C9824A]", badge: "bg-[#C9824A] text-[#2e1706]", label: "Bronze" },
};

export function TableLeaderboard({ leaderboard, playerBasePath }: { leaderboard: TableLeaderboardDto; playerBasePath?: string }) {
  const { entries } = leaderboard;
  if (entries.length === 0) {
    return <EmptyState icon={<ClipboardList />} title="Pas encore de table tenue cette saison" description="Le classement apparaîtra dès les premières tables de marque passées." />;
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  // Ordre visuel du podium : 2e, 1er, 3e.
  const podiumOrder = podium.length === 3 ? [podium[1]!, podium[0]!, podium[2]!] : podium.length === 2 ? [podium[1]!, podium[0]!] : podium;
  const href = (e: TableLeaderboardEntryDto) => (playerBasePath ? `${playerBasePath}/${e.licencie.id}` : null);

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Podium" className="relative isolate overflow-hidden rounded-[24px] border border-border bg-[#141414] px-3 pb-5 pt-6 text-white shadow-2 sm:px-6">
        <span aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_0%,var(--club-accent)_0%,transparent_70%)] opacity-60" />
        <p className="mb-5 flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
          <Trophy aria-hidden className="size-4" />
          {leaderboard.totalDone} table{leaderboard.totalDone > 1 ? "s" : ""} tenue{leaderboard.totalDone > 1 ? "s" : ""} cette saison
        </p>
        <ol className={cn("mx-auto grid max-w-xl items-end gap-2 sm:gap-4", podiumOrder.length === 3 ? "grid-cols-3" : podiumOrder.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
          {podiumOrder.map((e) => (
            <li key={e.licencie.id} className="min-w-0">
              <MaybeLink href={href(e)} className="rounded-[18px]">
                <PodiumSpot entry={e} first={e === podium[0]} />
              </MaybeLink>
            </li>
          ))}
        </ol>
      </section>

      {rest.length > 0 ? (
        <ol className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-raised shadow-1" aria-label="Suite du classement">
          {rest.map((e) => (
            <li key={e.licencie.id}>
              <MaybeLink href={href(e)}>
                <Row entry={e} linked={Boolean(href(e))} />
              </MaybeLink>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function PodiumSpot({ entry, first }: { entry: TableLeaderboardEntryDto; first: boolean }) {
  const medal = MEDAL[entry.rank] ?? MEDAL[3]!;
  const name = `${entry.licencie.firstName} ${entry.licencie.lastName}`;
  const size = first ? "size-24 sm:size-28" : "size-[4.5rem] sm:size-20";
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", first ? "pb-1" : "pb-0")}>
      <div className="relative">
        {entry.licencie.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo stockée par le club, hors domaines Next configurés
          <img src={entry.licencie.photoUrl} alt="" className={cn(size, "rounded-full object-cover ring-4 ring-offset-2 ring-offset-[#141414]", medal.ring)} />
        ) : (
          <span aria-hidden className={cn(size, "flex items-center justify-center rounded-full bg-white/10 text-xl font-semibold text-white/75 ring-4 ring-offset-2 ring-offset-[#141414]", medal.ring)}>
            {monogram(name)}
          </span>
        )}
        <span className={cn("type-numeric absolute -bottom-2 left-1/2 inline-flex size-7 -translate-x-1/2 items-center justify-center rounded-full text-[13px] font-bold shadow-1", medal.badge)}>
          {entry.rank}
          <span className="sr-only"> — médaille {medal.label.toLowerCase()}</span>
        </span>
      </div>
      <div className="mt-2 flex w-full min-w-0 flex-col">
        <span className="truncate text-[13px] text-white/80">{entry.licencie.firstName}</span>
        <span className={cn("truncate font-semibold uppercase", first ? "text-[15px]" : "text-[13px]")}>{entry.licencie.lastName}</span>
      </div>
      <span className={cn("type-numeric rounded-full bg-white/10 px-2.5 py-1 font-semibold leading-none", first ? "text-lg" : "text-[15px]")}>
        {entry.done} <span className="text-[11px] font-medium text-white/70">table{entry.done > 1 ? "s" : ""}</span>
      </span>
    </div>
  );
}

function Row({ entry, linked }: { entry: TableLeaderboardEntryDto; linked: boolean }) {
  const name = `${entry.licencie.firstName} ${entry.licencie.lastName}`;
  return (
    <div className={cn("flex min-h-16 items-center gap-3 px-3 py-2.5", linked && "transition-colors hover:bg-surface-muted")}>
      <span className="type-numeric w-7 shrink-0 text-center text-[15px] font-semibold text-muted">{entry.rank}</span>
      <PersonAvatar name={name} src={entry.licencie.photoUrl} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-foreground">{name}</p>
        <p className="type-meta truncate text-[12.5px]">
          {entry.byRole.map((r) => `${TABLE_ROLE_LABELS[r.role]} ×${r.count}`).join(" · ")}
          {entry.upcoming > 0 ? ` · ${entry.upcoming} à venir` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="type-numeric text-2xl font-semibold leading-none text-foreground">{entry.done}</span>
        <span className="type-meta text-[11px]">table{entry.done > 1 ? "s" : ""}</span>
      </div>
      {linked ? <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle" /> : null}
    </div>
  );
}

function MaybeLink({ href, className, children }: { href: string | null; className?: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className={cn("block", className)}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  );
}
