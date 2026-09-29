import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicClub } from "@/lib/api/publicTables";
import { listPublicMatches, listPublicTeams } from "@/lib/api/publicMatches";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { currentSeasonStart } from "@/lib/season";
import { MatchTitle, derogationBadge, formatMatchDateTime, matchResultLabel } from "@/features/matches/match-display";
import { HomeMatchesAgenda } from "@/features/matches/HomeMatchesAgenda";

type WhenFilter = "weekend" | "upcoming" | "past";
type SideFilter = "all" | "home" | "away";

const WHEN_OPTIONS: { value: WhenFilter; label: string }[] = [
  { value: "weekend", label: "Ce week-end" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
];

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "home", label: "Domicile" },
  { value: "away", label: "Extérieur" },
];

/** Même logique que `../../../c/[clubSlug]/matchs/page.tsx` (dupliquée volontairement, deux pages indépendantes sans design system partagé — voir aussi TeamBadge dans la fiche match). */
function currentWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day) % 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysUntilSaturday);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { start, end };
}

function buildFilterHref(
  clubSlug: string,
  current: { when: WhenFilter; side: SideFilter; team: string | null },
  changes: Partial<typeof current>,
): string {
  const next = { ...current, ...changes };
  const search = new URLSearchParams();
  if (next.when !== "weekend") search.set("when", next.when);
  if (next.side !== "all") search.set("side", next.side);
  if (next.team) search.set("team", next.team);
  const query = search.toString();
  return query ? `/public/${clubSlug}/matchs?${query}` : `/public/${clubSlug}/matchs`;
}

/**
 * Vue PUBLIQUE en lecture seule des matchs (retour du club, 2026-09-29 :
 * "je veux une vue publique avec toutes les infos en vue directe, sans les
 * boutons etc, en gros sans les fonctions admin, et sans compte, en libre
 * service") — même mise en page que `/c/{clubSlug}/matchs`, sans session
 * Supabase : toutes les données viennent de `GET /v1/public/clubs/{clubSlug}/...`
 * (voir club-manager-api/docs/PUBLIC_MATCHES.md), aucune action possible.
 */
export default async function PublicMatchsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;

  let club;
  try {
    club = await getPublicClub(clubSlug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const resolvedSearchParams = await searchParams;
  const when: WhenFilter = resolvedSearchParams.when === "upcoming" || resolvedSearchParams.when === "past" ? resolvedSearchParams.when : "weekend";
  const side: SideFilter = resolvedSearchParams.side === "home" || resolvedSearchParams.side === "away" ? resolvedSearchParams.side : "all";
  const team = typeof resolvedSearchParams.team === "string" ? resolvedSearchParams.team : null;

  const seasonStart = currentSeasonStart();
  const [teams, matches0] = await Promise.all([listPublicTeams(clubSlug), listPublicMatches(clubSlug, { from: seasonStart.toISOString() })]);

  let matches = matches0;
  if (team) {
    const teamName = teams.find((t) => t.id === team)?.name ?? null;
    matches = teamName ? matches.filter((m) => m.teamName === teamName) : matches;
  }
  if (side !== "all") matches = matches.filter((m) => m.isHome === (side === "home"));

  const now = new Date();
  if (when === "weekend") {
    const { start, end } = currentWeekendRange();
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) >= start && new Date(m.matchDatetime) < end);
  } else if (when === "upcoming") {
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) >= now);
  } else {
    matches = matches.filter((m) => m.matchDatetime !== null && new Date(m.matchDatetime) < now);
  }

  matches = [...matches].sort((a, b) => {
    const aTime = a.matchDatetime ? new Date(a.matchDatetime).getTime() : 0;
    const bTime = b.matchDatetime ? new Date(b.matchDatetime).getTime() : 0;
    return when === "past" ? bTime - aTime : aTime - bTime;
  });

  const currentFilters = { when, side, team };
  const homeMatches = matches.filter((m) => m.isHome === true);
  const otherMatches = matches.filter((m) => m.isHome !== true);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-lg font-semibold">Matchs — {club.name}</h1>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {WHEN_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={buildFilterHref(clubSlug, currentFilters, { when: option.value })}
              className={`rounded-full border px-3 py-1 ${
                when === option.value
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {SIDE_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={buildFilterHref(clubSlug, currentFilters, { side: option.value })}
              className={`rounded-full border px-3 py-1 ${
                side === option.value
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        {teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFilterHref(clubSlug, currentFilters, { team: null })}
              className={`rounded-full border px-3 py-1 ${
                !team
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              }`}
            >
              Toutes les équipes
            </Link>
            {teams.map((t) => (
              <Link
                key={t.id}
                href={buildFilterHref(clubSlug, currentFilters, { team: t.id })}
                className={`rounded-full border px-3 py-1 ${
                  team === t.id
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {matches.length === 0 ? (
        <Card title="Aucun match">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Aucun match ne correspond à ces filtres.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {homeMatches.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">Matchs à domicile</h2>
              <HomeMatchesAgenda matches={homeMatches} basePath={`/public/${clubSlug}/matchs`} clubName={club.name} clubLogoUrl={club.logoUrl} />
            </section>
          ) : null}

          {otherMatches.length > 0 ? (
            <section className="flex flex-col gap-3">
              {homeMatches.length > 0 ? <h2 className="text-sm font-semibold text-black/70 dark:text-white/70">Matchs à l&apos;extérieur</h2> : null}
              <ul className="flex flex-col gap-3">
                {otherMatches.map((match) => {
                  const badge = derogationBadge(match.derogationStatus);
                  return (
                    <li key={match.id}>
                      <Link href={`/public/${clubSlug}/matchs/${match.id}`} className="block">
                        <Card
                          title={
                            <span className="flex flex-wrap items-center gap-2">
                              <MatchTitle
                                clubName={match.teamName ?? club.name}
                                clubLogoUrl={club.logoUrl}
                                opponentName={match.opponentName ?? "?"}
                                opponentLogoUrl={match.opponentLogoUrl}
                                isHome={match.isHome === true}
                              />
                              {badge ? <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span> : null}
                            </span>
                          }
                        >
                          <dl className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/60 dark:text-white/60">
                            <dd>{formatMatchDateTime(match.matchDatetime)}</dd>
                            <dd>{match.venueLabel ?? "Lieu à confirmer"}</dd>
                            <dd>{matchResultLabel(match)}</dd>
                          </dl>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
