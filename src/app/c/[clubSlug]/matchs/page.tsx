import Link from "next/link";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { currentSeasonStart } from "@/lib/season";

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

/** Samedi 00:00 -> lundi 00:00 de la semaine courante (Europe/Paris implicite : dates stockées en UTC, affichées en heure locale). */
function currentWeekendRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche ... 6 = samedi
  const daysUntilSaturday = (6 - day) % 7;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysUntilSaturday);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { start, end };
}

function formatMatchDateTime(value: string | null): string {
  if (!value) return "Date à confirmer";
  return new Date(value).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
  return query ? `/c/${clubSlug}/matchs?${query}` : `/c/${clubSlug}/matchs`;
}

/**
 * Vue "Ce week-end" + filtres (ARCHITECTURE.md §3, Module 1), scopée au
 * club de l'URL. Lecture seule, via club-manager-api (§14 de la demande) —
 * ce frontend n'interroge plus jamais `matches`/`teams` directement.
 *
 * `api.matches.list` filtre déjà sur la saison en cours côté API
 * (`from: currentSeasonStart()`, voir `src/lib/api/matches.ts`) — les
 * saisons passées restent en base (jamais supprimées côté API) mais ne
 * sont pas chargées par cette page, ni par défaut ni sur les filtres
 * when/side/team ci-dessous (elle ne portent que sur la saison déjà
 * filtrée). Volontaire : demande explicite de ne pas afficher/charger
 * l'historique, et ça évite de récupérer des centaines/milliers de
 * matchs à chaque visite à mesure que l'historique du club grandit.
 */
export default async function MatchsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);

  const resolvedSearchParams = await searchParams;
  const when: WhenFilter = resolvedSearchParams.when === "upcoming" || resolvedSearchParams.when === "past" ? resolvedSearchParams.when : "weekend";
  const side: SideFilter = resolvedSearchParams.side === "home" || resolvedSearchParams.side === "away" ? resolvedSearchParams.side : "all";
  const team = typeof resolvedSearchParams.team === "string" ? resolvedSearchParams.team : null;

  const seasonStart = currentSeasonStart();
  const [teams, matches0] = await Promise.all([
    api.clubs.teams(club.id),
    api.matches.list(club.id, { from: seasonStart.toISOString() }),
  ]);

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Matchs</h1>

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
        <ul className="flex flex-col gap-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link href={`/c/${clubSlug}/matchs/${match.id}`} className="block">
                <Card title={`${match.teamName ?? "Équipe"} ${match.isHome ? "vs" : "@"} ${match.opponentName ?? "?"}`}>
                  <dl className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/60 dark:text-white/60">
                    <dd>{formatMatchDateTime(match.matchDatetime)}</dd>
                    <dd>{match.venueLabel ?? "Lieu à confirmer"}</dd>
                    <dd>
                      {match.scoreHome !== null && match.scoreAway !== null
                        ? `${match.scoreHome} - ${match.scoreAway}`
                        : match.status === "postponed"
                          ? "Reporté"
                          : match.status === "cancelled"
                            ? "Annulé"
                            : match.status === "forfeit"
                              ? "Forfait"
                              : "À venir"}
                    </dd>
                  </dl>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
