import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { cn } from "@/components/ui/cn";
import type { MatchDetailsDto } from "@/lib/api/matches";
import { formatSecondsPlayed } from "./labels";

type StatRow = MatchDetailsDto["stats"][number];

/**
 * Stats d'une équipe, pensées mobile d'abord (retour du club, 2026-10-08 :
 * "plutôt des cartes avec la photo du joueur", puis "un truc UX friendly,
 * vue d'ensemble, natif mobile, simple") :
 *  - top 3 marqueurs en cartes photo ;
 *  - toute l'équipe en liste, meilleur marqueur d'abord : photo, nom, points
 *    en grand, le reste en une ligne — lisible d'un coup d'œil, sans
 *    défilement horizontal.
 * Photo seulement si la fiche joueur en a une (espace club) ; sinon initiales.
 */
export function PlayerStatCards({ rows, accent, playerBasePath }: { rows: StatRow[]; accent: boolean; playerBasePath?: string }) {
  const sorted = [...rows].sort((a, b) => (b.points ?? -1) - (a.points ?? -1) || (b.secondsPlayed ?? 0) - (a.secondsPlayed ?? 0));
  const total = (pick: (r: StatRow) => number | null) => rows.reduce((sum, r) => sum + (pick(r) ?? 0), 0);

  // Top 3 marqueurs uniquement (retour du club, 2026-10-08 : "juste le top 3 scoreurs, c'est tout").
  const highlights = sorted
    .filter((r) => (r.points ?? 0) > 0)
    .slice(0, 3)
    .map((row, index) => ({ label: `${index + 1}${index === 0 ? "er" : "e"} marqueur`, row, value: `${row.points} pts` }));

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-raised p-3 text-center shadow-1">
        <TeamTotal label="Points" value={total((r) => r.points)} />
        <TeamTotal label="Tirs à 3 pts" value={total((r) => r.threePointsMade)} />
        <TeamTotal label="Lancers francs" value={total((r) => r.freeThrowsMade)} />
      </dl>

      {highlights.length > 0 ? (
        <section aria-label="Top 3 marqueurs" className="flex flex-col gap-2">
          <p className="type-eyebrow">Top 3 marqueurs</p>
          <ul className="grid max-w-lg grid-cols-3 gap-2">
            {highlights.map((h) => (
              <li key={h.label}>
                <Highlight label={h.label} row={h.row} value={h.value} accent={accent} href={linkFor(h.row, playerBasePath)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-raised shadow-1" aria-label="Statistiques par joueur">
        {sorted.map((row) => (
          <li key={row.participantId}>
            <PlayerRow row={row} href={linkFor(row, playerBasePath)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function linkFor(row: StatRow, playerBasePath?: string): string | null {
  return playerBasePath && row.licencieId ? `${playerBasePath}/${row.licencieId}` : null;
}

function displayName(row: StatRow): string {
  return `${row.firstName?.trim() ?? ""} ${row.lastName?.trim() ?? ""}`.trim() || "Joueur·se";
}

function TeamTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <dd className="type-numeric text-xl font-semibold text-foreground">{value}</dd>
      <dt className="type-meta text-[11.5px]">{label}</dt>
    </div>
  );
}

function Highlight({ label, row, value, accent, href }: { label: string; row: StatRow; value: string; accent: boolean; href: string | null }) {
  const name = displayName(row);
  const body = (
    <article className="relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-[16px] border border-border bg-[#161616] shadow-1">
      {row.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL de photo arbitraire fournie par le club, hors domaines Next configurés
        <img src={row.photoUrl} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
      ) : (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 flex items-start justify-center pt-[22%] text-[34px] font-semibold text-white/25",
            accent ? "bg-[radial-gradient(110%_80%_at_50%_0%,var(--club-accent)_0%,#161616_75%)]" : "bg-[radial-gradient(110%_80%_at_50%_0%,#4a4a4a_0%,#161616_75%)]",
          )}
        >
          {initials(name)}
        </span>
      )}
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      {href ? <ChevronRight aria-hidden className="absolute right-1.5 top-1.5 size-4 text-white/80" /> : null}
      <div className="flex flex-col gap-0.5 p-2 text-white">
        <span className="text-[10px] font-medium uppercase tracking-wide text-white/70">{label}</span>
        <span className="type-numeric text-[15px] font-bold leading-tight">{value}</span>
        <span className="truncate text-[11.5px] text-white/85">
          #{row.jerseyNumber ?? "?"} {row.lastName ?? name}
        </span>
      </div>
    </article>
  );
  return href ? (
    <Link href={href} className="block rounded-[16px]">
      {body}
    </Link>
  ) : (
    body
  );
}

function PlayerRow({ row, href }: { row: StatRow; href: string | null }) {
  const name = displayName(row);
  const content = (
    <div className={cn("flex min-h-16 items-center gap-3 px-3 py-2.5", href && "transition-colors hover:bg-surface-muted")}>
      <PersonAvatar name={name} src={row.photoUrl} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-foreground">
          <span className="type-numeric mr-1.5 text-muted">#{row.jerseyNumber ?? "?"}</span>
          {href ? <span className="underline decoration-border-strong underline-offset-4">{name}</span> : name}
        </p>
        <p className="type-meta type-numeric truncate text-[12.5px]">
          {formatSecondsPlayed(row.secondsPlayed)} · {row.threePointsMade ?? "—"}×3 pts · {row.twoPointsInteriorMade ?? "—"} int · {row.twoPointsExteriorMade ?? "—"} ext · {row.freeThrowsMade ?? "—"} LF · {row.foulsCommitted ?? "—"} f.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="type-numeric text-2xl font-semibold leading-none text-foreground">{row.points ?? "—"}</span>
        <span className="type-meta text-[11px]">pts</span>
      </div>
      {href ? (
        <span className="type-meta flex shrink-0 items-center text-[11.5px] text-accent-text">
          Fiche
          <ChevronRight aria-hidden className="size-4" />
        </span>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
