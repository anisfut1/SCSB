import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

type Tab = "informations" | "composition" | "statistiques" | "officiels" | "emarque";

const TABS: { value: Tab; label: string }[] = [
  { value: "informations", label: "Informations" },
  { value: "composition", label: "Composition" },
  { value: "statistiques", label: "Statistiques" },
  { value: "officiels", label: "Officiels" },
  { value: "emarque", label: "e-Marque" },
];

const REFEREE_ROLE_LABELS: Record<string, string> = { referee_1: "1er arbitre", referee_2: "2e arbitre", referee_3: "3e arbitre" };
const TABLE_OFFICIAL_ROLE_LABELS: Record<string, string> = {
  scorer: "Marqueur",
  assistant_scorer: "Aide-marqueur",
  timekeeper: "Chronométreur",
  shot_clock_operator: "Chronométreur des 24s",
  commissioner: "Commissaire",
  other: "Autre",
};

const EMARQUE_STATUS_LABELS: Record<string, string> = {
  not_applicable: "Non concerné",
  pending: "En attente de traitement",
  waiting_for_emarque: "En attente du document FBI",
  imported: "Importé",
  error: "Erreur de traitement",
  needs_review: "En cours de vérification",
};

function formatMatchDateTime(value: string | null): string {
  if (!value) return "Date à confirmer";
  return new Date(value).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSecondsPlayed(seconds: number | null): string {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tab: Tab = TABS.some((t) => t.value === resolvedSearchParams.tab) ? (resolvedSearchParams.tab as Tab) : "informations";

  const supabase = await createServerSupabaseClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, numero, match_datetime, is_home, opponent_name, score_home, score_away, status, emarque_status, venue_raw_label, journee, team_id")
    .eq("id", id)
    .maybeSingle();

  if (!match) notFound();

  const { data: team } = match.team_id ? await supabase.from("teams").select("name").eq("id", match.team_id).maybeSingle() : { data: null };

  const homeLabel = match.is_home ? (team?.name ?? "Équipe") : (match.opponent_name ?? "?");
  const awayLabel = match.is_home ? (match.opponent_name ?? "?") : (team?.name ?? "Équipe");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/matchs" className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour aux matchs
        </Link>
        <h1 className="mt-2 text-lg font-semibold">
          {homeLabel} vs {awayLabel}
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{formatMatchDateTime(match.match_datetime)}</p>
      </div>

      <nav className="flex gap-4 overflow-x-auto border-b border-black/10 text-sm dark:border-white/10">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/matchs/${id}?tab=${t.value}`}
            className={`whitespace-nowrap border-b-2 pb-2 ${
              tab === t.value ? "border-black font-medium dark:border-white" : "border-transparent text-black/60 dark:text-white/60"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "informations" ? <InformationsTab match={match} homeLabel={homeLabel} awayLabel={awayLabel} /> : null}
      {tab === "composition" ? <CompositionTab supabase={supabase} matchId={id} /> : null}
      {tab === "statistiques" ? <StatistiquesTab supabase={supabase} matchId={id} /> : null}
      {tab === "officiels" ? <OfficielsTab supabase={supabase} matchId={id} /> : null}
      {tab === "emarque" ? <EmarqueTab supabase={supabase} matchId={id} /> : null}
    </div>
  );
}

type MatchRow = {
  numero: string | null;
  match_datetime: string | null;
  score_home: number | null;
  score_away: number | null;
  status: string;
  emarque_status: string;
  venue_raw_label: string | null;
  journee: string | null;
};

function InformationsTab({ match, homeLabel, awayLabel }: { match: MatchRow; homeLabel: string; awayLabel: string }) {
  return (
    <Card title="Informations">
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-black/60 dark:text-white/60">Rencontre</dt>
          <dd>N° {match.numero ?? "?"}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Journée</dt>
          <dd>{match.journee ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Lieu</dt>
          <dd>{match.venue_raw_label ?? "À confirmer"}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Score</dt>
          <dd>
            {match.score_home !== null && match.score_away !== null
              ? `${homeLabel} ${match.score_home} - ${match.score_away} ${awayLabel}`
              : "Non disponible"}
          </dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Statut</dt>
          <dd>{match.status}</dd>
        </div>
      </dl>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerSupabase = any;

interface ParticipantRow {
  id: string;
  team_side: "home" | "away";
  jersey_number: string | null;
  first_name: string | null;
  last_name: string | null;
  is_captain: boolean;
  is_starter: boolean | null;
}

interface CoachRow {
  team_side: "home" | "away";
  role: "principal" | "adjoint";
  first_name: string | null;
  last_name: string | null;
}

async function CompositionTab({ supabase, matchId }: { supabase: ServerSupabase; matchId: string }) {
  const [{ data: participants }, { data: coaches }]: [{ data: ParticipantRow[] | null }, { data: CoachRow[] | null }] = await Promise.all([
    supabase
      .from("match_participants")
      .select("id, team_side, jersey_number, first_name, last_name, is_captain, is_starter")
      .eq("match_id", matchId)
      .order("team_side")
      .order("jersey_number"),
    supabase.from("match_coaches").select("team_side, role, first_name, last_name").eq("match_id", matchId),
  ]);

  if ((!participants || participants.length === 0) && (!coaches || coaches.length === 0)) {
    return (
      <Card title="Composition">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Composition pas encore disponible (document e-Marque non importé pour ce match).
        </p>
      </Card>
    );
  }

  const bySide = { home: participants?.filter((p) => p.team_side === "home") ?? [], away: participants?.filter((p) => p.team_side === "away") ?? [] };
  const coachesBySide = { home: coaches?.filter((c) => c.team_side === "home") ?? [], away: coaches?.filter((c) => c.team_side === "away") ?? [] };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {(["home", "away"] as const).map((side) => (
        <Card key={side} title={side === "home" ? "Domicile" : "Extérieur"}>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {bySide[side].map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="w-8 text-black/60 dark:text-white/60">#{p.jersey_number ?? "?"}</span>
                <span>
                  {p.first_name ?? ""} {p.last_name ?? "(nom non lu)"}
                  {p.is_captain ? " (C)" : ""}
                  {p.is_starter ? " · titulaire" : ""}
                </span>
              </li>
            ))}
            {coachesBySide[side].map((c, index) => (
              <li key={`coach-${index}`} className="mt-2 border-t border-black/10 pt-2 text-black/70 dark:border-white/10 dark:text-white/70">
                {c.role === "principal" ? "Entraîneur" : "Entraîneur adjoint"} : {c.first_name ?? ""} {c.last_name ?? "(nom non lu)"}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

async function StatistiquesTab({ supabase, matchId }: { supabase: ServerSupabase; matchId: string }) {
  const { data: stats } = await supabase
    .from("player_match_stats")
    .select(
      "seconds_played, points, shots_made, three_points_made, two_points_interior_made, two_points_exterior_made, free_throws_made, fouls_committed, match_participants(team_side, jersey_number, first_name, last_name)",
    )
    .eq("match_id", matchId);

  if (!stats || stats.length === 0) {
    return (
      <Card title="Statistiques">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Statistiques pas encore disponibles pour ce match.</p>
      </Card>
    );
  }

  return (
    <Card title="Statistiques individuelles">
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-black/60 dark:text-white/60">
              <th className="pr-2">Joueur</th>
              <th className="px-2 text-right">Temps</th>
              <th className="px-2 text-right">Pts</th>
              <th className="px-2 text-right">3pts</th>
              <th className="px-2 text-right">2int</th>
              <th className="px-2 text-right">2ext</th>
              <th className="px-2 text-right">LF</th>
              <th className="px-2 text-right">Fautes</th>
            </tr>
          </thead>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {stats.map((row: any, index: number) => (
              <tr key={index} className="border-t border-black/5 dark:border-white/10">
                <td className="py-1 pr-2">
                  #{row.match_participants?.jersey_number ?? "?"} {row.match_participants?.first_name ?? ""}{" "}
                  {row.match_participants?.last_name ?? "(nom non lu)"}
                </td>
                <td className="px-2 text-right">{formatSecondsPlayed(row.seconds_played)}</td>
                <td className="px-2 text-right">{row.points ?? "—"}</td>
                <td className="px-2 text-right">{row.three_points_made ?? "—"}</td>
                <td className="px-2 text-right">{row.two_points_interior_made ?? "—"}</td>
                <td className="px-2 text-right">{row.two_points_exterior_made ?? "—"}</td>
                <td className="px-2 text-right">{row.free_throws_made ?? "—"}</td>
                <td className="px-2 text-right">{row.fouls_committed ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-black/50 dark:text-white/50">
        &laquo; — &raquo; signifie une donnée non lue avec certitude sur le document, jamais une valeur nulle supposée.
      </p>
    </Card>
  );
}

interface NamedRoleRow {
  role: string;
  first_name: string | null;
  last_name: string | null;
}

async function OfficielsTab({ supabase, matchId }: { supabase: ServerSupabase; matchId: string }) {
  const [{ data: officials }, { data: tableOfficials }]: [{ data: NamedRoleRow[] | null }, { data: NamedRoleRow[] | null }] = await Promise.all([
    supabase.from("match_officials").select("role, first_name, last_name").eq("match_id", matchId),
    supabase.from("match_table_officials").select("role, first_name, last_name").eq("match_id", matchId),
  ]);

  if ((!officials || officials.length === 0) && (!tableOfficials || tableOfficials.length === 0)) {
    return (
      <Card title="Officiels">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Officiels pas encore disponibles pour ce match.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card title="Arbitres">
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {(officials ?? []).map((o, index) => (
            <li key={index}>
              {REFEREE_ROLE_LABELS[o.role] ?? o.role} : {o.first_name ?? ""} {o.last_name ?? "(nom non lu)"}
            </li>
          ))}
          {(!officials || officials.length === 0) && <li className="text-black/60 dark:text-white/60">Non disponible</li>}
        </ul>
      </Card>
      <Card title="Officiels de table (OTM)">
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {(tableOfficials ?? []).map((o, index) => (
            <li key={index}>
              {TABLE_OFFICIAL_ROLE_LABELS[o.role] ?? o.role} : {o.first_name ?? ""} {o.last_name ?? "(nom non lu)"}
            </li>
          ))}
          {(!tableOfficials || tableOfficials.length === 0) && <li className="text-black/60 dark:text-white/60">Non disponible</li>}
        </ul>
      </Card>
    </div>
  );
}

async function EmarqueTab({ supabase, matchId }: { supabase: ServerSupabase; matchId: string }) {
  const { data: match } = await supabase.from("matches").select("emarque_status").eq("id", matchId).maybeSingle();
  const { data: latestImport } = await supabase
    .from("emarque_imports")
    .select("status, discovered_at, imported_at, quality_warnings")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <Card title="e-Marque">
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-black/60 dark:text-white/60">Statut</dt>
          <dd>{EMARQUE_STATUS_LABELS[match?.emarque_status ?? "not_applicable"] ?? match?.emarque_status}</dd>
        </div>
        {latestImport ? (
          <div>
            <dt className="text-black/60 dark:text-white/60">Importé le</dt>
            <dd>{latestImport.imported_at ? new Date(latestImport.imported_at).toLocaleString("fr-FR") : "—"}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs text-black/50 dark:text-white/50">
        Le document e-Marque original n&apos;est pas exposé directement ici (données personnelles) — cette page
        n&apos;affiche que les informations déjà normalisées dans les autres onglets.
      </p>
      {latestImport?.quality_warnings && Array.isArray(latestImport.quality_warnings) && latestImport.quality_warnings.length > 0 ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Certaines informations de ce match sont en cours de vérification par un administrateur.
        </p>
      ) : null}
    </Card>
  );
}
