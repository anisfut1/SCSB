import Link from "next/link";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

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
 * club de l'URL. Lecture seule : les données affichées viennent
 * exclusivement de la synchronisation automatique FFBB/e-Marque de CE club.
 *
 * `club_id` est filtré explicitement en plus de la RLS (§58 du brief SaaS) :
 * un utilisateur membre de plusieurs clubs ne doit jamais voir les matchs
 * d'un AUTRE club mélangés sur cette page, même si la RLS les autoriserait
 * en lecture par ailleurs.
 */
export default async function MatchsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug } = await params;
  const { club } = await requireClubContext(clubSlug);

  const resolvedSearchParams = await searchParams;
  const when: WhenFilter = resolvedSearchParams.when === "upcoming" || resolvedSearchParams.when === "past" ? resolvedSearchParams.when : "weekend";
  const side: SideFilter = resolvedSearchParams.side === "home" || resolvedSearchParams.side === "away" ? resolvedSearchParams.side : "all";
  const team = typeof resolvedSearchParams.team === "string" ? resolvedSearchParams.team : null;

  const supabase = await createServerSupabaseClient();

  const { data: teams } = await supabase.from("teams").select("id, name").eq("club_id", club.id).order("name");

  let query = supabase
    .from("matches")
    .select("id, numero, match_datetime, is_home, opponent_name, score_home, score_away, status, emarque_status, venue_raw_label, team_id")
    .eq("club_id", club.id);

  if (team) query = query.eq("team_id", team);
  if (side !== "all") query = query.eq("is_home", side === "home");

  const now = new Date();
  if (when === "weekend") {
    const { start, end } = currentWeekendRange();
    query = query.gte("match_datetime", start.toISOString()).lt("match_datetime", end.toISOString());
  } else if (when === "upcoming") {
    query = query.gte("match_datetime", now.toISOString());
  } else {
    query = query.lt("match_datetime", now.toISOString());
  }

  query = query.order("match_datetime", { ascending: when !== "past" });

  const { data: matches } = await query;
  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
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

        {teams && teams.length > 0 ? (
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

      {!matches || matches.length === 0 ? (
        <Card title="Aucun match">
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">Aucun match ne correspond à ces filtres.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((match) => (
            <li key={match.id}>
              <Link href={`/c/${clubSlug}/matchs/${match.id}`} className="block">
                <Card title={`${teamNameById.get(match.team_id ?? "") ?? "Équipe"} ${match.is_home ? "vs" : "@"} ${match.opponent_name ?? "?"}`}>
                  <dl className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/60 dark:text-white/60">
                    <dd>{formatMatchDateTime(match.match_datetime)}</dd>
                    <dd>{match.venue_raw_label ?? "Lieu à confirmer"}</dd>
                    <dd>
                      {match.score_home !== null && match.score_away !== null
                        ? `${match.score_home} - ${match.score_away}`
                        : match.status === "postponed"
                          ? "Reporté"
                          : match.status === "cancelled"
                            ? "Annulé"
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
