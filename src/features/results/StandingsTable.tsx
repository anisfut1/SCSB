import { ListOrdered } from "lucide-react";
import { TeamLogo } from "@/components/ui/Logo";
import { cn } from "@/components/ui/cn";
import type { PoolStandingsDto } from "@/lib/api/publicMatches";

function formatUpdatedAt(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }) : null;
}

function n(value: number | null): string {
  return value === null ? "—" : String(value);
}

function signed(value: number | null): string {
  if (value === null) return "—";
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Classement FFBB d'une poule (retour du club, 2026-10-01 : "et même le
 * classement... qui est dispo sur FFBB"). Valeurs telles que publiées par
 * la FFBB, jamais recalculées ; la ligne du club est mise en avant.
 */
export function StandingsTable({ pool, clubLogoUrl }: { pool: PoolStandingsDto; clubLogoUrl: string | null }) {
  const updatedAt = formatUpdatedAt(pool.updatedAt);
  return (
    <section aria-label={`Classement ${pool.poolName}`} className="surface-card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <ListOrdered aria-hidden className="mt-0.5 size-4 shrink-0 text-accent-text" />
        <div className="text-reflow flex-1">
          <h3 className="type-card text-foreground">Classement · {pool.poolName}</h3>
          {pool.competitionName ? <p className="type-meta">{pool.competitionName}</p> : null}
        </div>
      </header>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="type-eyebrow border-b border-border text-left">
            <th scope="col" className="w-9 px-1 py-2 text-center font-medium sm:w-12 sm:px-3">#</th>
            <th scope="col" className="px-2 py-2 font-medium">Équipe</th>
            <th scope="col" className="w-10 px-1 py-2 text-right font-medium">Pts</th>
            <th scope="col" className="w-8 px-1 py-2 text-right font-medium">J</th>
            <th scope="col" className="w-8 px-1 py-2 text-right font-medium">G</th>
            <th scope="col" className="w-9 px-1 py-2 pr-3 text-right font-medium sm:w-8 sm:pr-1">P</th>
            <th scope="col" className="hidden w-14 px-1 py-2 pr-4 text-right font-medium sm:table-cell">+/-</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {pool.rows.map((row, index) => (
            <tr key={`${row.teamName}-${index}`} aria-current={row.isClub || undefined} className={cn(row.isClub && "bg-accent-softer")}>
              <td className="type-numeric px-1 py-2.5 text-center text-muted sm:px-3">
                <span className={cn(row.isClub && "font-semibold text-accent-text")}>{row.outOfRanking ? "HC" : n(row.position)}</span>
              </td>
              <td className="px-2 py-2.5">
                <span className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <TeamLogo name={row.teamName} src={row.isClub ? (clubLogoUrl ?? row.logoUrl) : row.logoUrl} size="xs" accent={row.isClub} />
                  <span className={cn("line-clamp-2 min-w-0 break-words leading-tight", row.isClub ? "font-semibold text-foreground" : "text-foreground")}>{row.teamName}</span>
                </span>
              </td>
              <td className={cn("type-numeric px-1 py-2.5 text-right tabular-nums", row.isClub ? "font-semibold text-foreground" : "font-medium text-foreground")}>{n(row.points)}</td>
              <td className="type-numeric px-1 py-2.5 text-right tabular-nums text-muted">{n(row.played)}</td>
              <td className="type-numeric px-1 py-2.5 text-right tabular-nums text-muted">{n(row.won)}</td>
              <td className="type-numeric px-1 py-2.5 pr-3 text-right tabular-nums text-muted sm:pr-1">{n(row.lost)}</td>
              <td className="type-numeric hidden px-1 py-2.5 pr-4 text-right tabular-nums text-muted sm:table-cell">{signed(row.difference)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="type-meta border-t border-border px-4 py-2.5">Classement FFBB{updatedAt ? ` · mis à jour le ${updatedAt}` : ""}</p>
    </section>
  );
}
