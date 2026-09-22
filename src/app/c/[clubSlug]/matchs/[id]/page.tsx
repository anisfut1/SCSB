import Link from "next/link";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import { notFound } from "next/navigation";
import { isClubAdmin } from "@/lib/permissions/roles";
import { Card } from "@/components/ui/Card";
import type { MatchDetailsDto, MatchDocumentDto } from "@/lib/api/matches";

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
  discovered: "Document découvert",
  downloading: "Téléchargement en cours",
  downloaded: "Téléchargé",
  parsing: "Traitement en cours",
  imported: "Importé",
  error: "Erreur de traitement",
  needs_review: "En cours de vérification",
};

/** Voir la même logique dans matchs/page.tsx (TeamBadge) — dupliquée ici volontairement, deux pages indépendantes sans design system partagé. */
function TeamBadge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="h-6 w-6 shrink-0 rounded-full bg-black/10 dark:bg-white/10" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- logos hébergés par api.ffbb.app, hors domaines Next configurés
  return <img src={src} alt={alt} className="h-6 w-6 shrink-0 rounded-full object-contain" />;
}

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

/**
 * §15 de la demande : toutes les données viennent de
 * `GET /v1/clubs/:clubId/matches/:matchId` (+ `.../documents` pour la liste
 * e-Marque, dont l'URL de téléchargement est déjà signée côté backend pour
 * un club_admin — voir docs/API.md). Aucun accès Supabase direct, jamais un
 * client service role ici : ce composant ne sait même plus qu'un bucket
 * Storage existe.
 */
export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { clubSlug, id } = await params;
  const club = await requireClubContext(clubSlug);
  const isAdmin = isClubAdmin(club.roles);
  const resolvedSearchParams = await searchParams;
  const tab: Tab = TABS.some((t) => t.value === resolvedSearchParams.tab) ? (resolvedSearchParams.tab as Tab) : "informations";

  let match: MatchDetailsDto;
  try {
    match = await api.matches.get(club.id, id);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const homeLabel = match.isHome ? (match.teamName ?? "Équipe") : (match.opponentName ?? "?");
  const awayLabel = match.isHome ? (match.opponentName ?? "?") : (match.teamName ?? "Équipe");
  const homeLogoUrl = match.isHome ? club.logoUrl : match.opponentLogoUrl;
  const awayLogoUrl = match.isHome ? match.opponentLogoUrl : club.logoUrl;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/c/${clubSlug}/matchs`} className="text-sm text-black/60 hover:underline dark:text-white/60">
          ← Retour aux matchs
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-lg font-semibold">
          <TeamBadge src={homeLogoUrl} alt={homeLabel} />
          <span>
            {homeLabel} vs {awayLabel}
          </span>
          <TeamBadge src={awayLogoUrl} alt={awayLabel} />
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">{formatMatchDateTime(match.matchDatetime)}</p>
      </div>

      <nav className="flex gap-4 overflow-x-auto border-b border-black/10 text-sm dark:border-white/10">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/c/${clubSlug}/matchs/${id}?tab=${t.value}`}
            className={`whitespace-nowrap border-b-2 pb-2 ${
              tab === t.value ? "border-black font-medium dark:border-white" : "border-transparent text-black/60 dark:text-white/60"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "informations" ? <InformationsTab match={match} homeLabel={homeLabel} awayLabel={awayLabel} /> : null}
      {tab === "composition" ? <CompositionTab match={match} /> : null}
      {tab === "statistiques" ? <StatistiquesTab match={match} /> : null}
      {tab === "officiels" ? <OfficielsTab match={match} /> : null}
      {tab === "emarque" ? <EmarqueTab clubId={club.id} matchId={id} match={match} isAdmin={isAdmin} /> : null}
    </div>
  );
}

function InformationsTab({ match, homeLabel, awayLabel }: { match: MatchDetailsDto; homeLabel: string; awayLabel: string }) {
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
          <dd>{match.venueLabel ?? "À confirmer"}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Score</dt>
          <dd>
            {match.scoreHome !== null && match.scoreAway !== null
              ? `${homeLabel} ${match.scoreHome} - ${match.scoreAway} ${awayLabel}`
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

function CompositionTab({ match }: { match: MatchDetailsDto }) {
  const { participants, coaches } = match;

  if (participants.length === 0 && coaches.length === 0) {
    return (
      <Card title="Composition">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Composition pas encore disponible (document e-Marque non importé pour ce match).
        </p>
      </Card>
    );
  }

  const bySide = { home: participants.filter((p) => p.teamSide === "home"), away: participants.filter((p) => p.teamSide === "away") };
  const coachesBySide = { home: coaches.filter((c) => c.teamSide === "home"), away: coaches.filter((c) => c.teamSide === "away") };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {(["home", "away"] as const).map((side) => (
        <Card key={side} title={side === "home" ? "Domicile" : "Extérieur"}>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {bySide[side].map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="w-8 text-black/60 dark:text-white/60">#{p.jerseyNumber ?? "?"}</span>
                <span>
                  {p.firstName ?? ""} {p.lastName ?? "(nom non lu)"}
                  {p.isCaptain ? " (C)" : ""}
                  {p.isStarter ? " · titulaire" : ""}
                </span>
              </li>
            ))}
            {coachesBySide[side].map((c, index) => (
              <li key={`coach-${index}`} className="mt-2 border-t border-black/10 pt-2 text-black/70 dark:border-white/10 dark:text-white/70">
                {c.role === "principal" ? "Entraîneur" : "Entraîneur adjoint"} : {c.firstName ?? ""} {c.lastName ?? "(nom non lu)"}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function StatistiquesTab({ match }: { match: MatchDetailsDto }) {
  const { stats } = match;

  if (stats.length === 0) {
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
            {stats.map((row, index) => (
              <tr key={index} className="border-t border-black/5 dark:border-white/10">
                <td className="py-1 pr-2">
                  #{row.jerseyNumber ?? "?"} {row.firstName ?? ""} {row.lastName ?? "(nom non lu)"}
                </td>
                <td className="px-2 text-right">{formatSecondsPlayed(row.secondsPlayed)}</td>
                <td className="px-2 text-right">{row.points ?? "—"}</td>
                <td className="px-2 text-right">{row.threePointsMade ?? "—"}</td>
                <td className="px-2 text-right">{row.twoPointsInteriorMade ?? "—"}</td>
                <td className="px-2 text-right">{row.twoPointsExteriorMade ?? "—"}</td>
                <td className="px-2 text-right">{row.freeThrowsMade ?? "—"}</td>
                <td className="px-2 text-right">{row.foulsCommitted ?? "—"}</td>
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

function OfficielsTab({ match }: { match: MatchDetailsDto }) {
  const { officials, tableOfficials } = match;

  if (officials.length === 0 && tableOfficials.length === 0) {
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
          {officials.map((o, index) => (
            <li key={index}>
              {REFEREE_ROLE_LABELS[o.role] ?? o.role} : {o.firstName ?? ""} {o.lastName ?? "(nom non lu)"}
            </li>
          ))}
          {officials.length === 0 && <li className="text-black/60 dark:text-white/60">Non disponible</li>}
        </ul>
      </Card>
      <Card title="Officiels de table (OTM)">
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {tableOfficials.map((o, index) => (
            <li key={index}>
              {TABLE_OFFICIAL_ROLE_LABELS[o.role] ?? o.role} : {o.firstName ?? ""} {o.lastName ?? "(nom non lu)"}
            </li>
          ))}
          {tableOfficials.length === 0 && <li className="text-black/60 dark:text-white/60">Non disponible</li>}
        </ul>
      </Card>
    </div>
  );
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  emarque_zip: "Export e-Marque complet",
  match_sheet: "Feuille de match",
  summary: "Résumé",
  shot_chart: "Positions de tirs",
  other: "Autre document",
};

async function EmarqueTab({ clubId, matchId, match, isAdmin }: { clubId: string; matchId: string; match: MatchDetailsDto; isAdmin: boolean }) {
  const documents: MatchDocumentDto[] = await api.matches.documents(clubId, matchId);

  return (
    <Card title="e-Marque">
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-black/60 dark:text-white/60">Statut</dt>
          <dd>{EMARQUE_STATUS_LABELS[match.emarque.status] ?? match.emarque.status}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Source</dt>
          <dd>{match.emarque.source ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-black/60 dark:text-white/60">Dernière récupération</dt>
          <dd>{match.emarque.lastRetrievedAt ? new Date(match.emarque.lastRetrievedAt).toLocaleString("fr-FR") : "—"}</dd>
        </div>
      </dl>

      {documents.length > 0 ? (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-black/80 dark:text-white/80">Documents</h4>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {documents.map((doc) => {
              const label = DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type;
              return (
                <li key={doc.id} className="flex items-center justify-between gap-2">
                  <span>{label}</span>
                  {isAdmin && doc.downloadUrl ? (
                    <a href={doc.downloadUrl} className="text-xs text-blue-700 hover:underline dark:text-blue-400" rel="noopener noreferrer">
                      Télécharger
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {!isAdmin ? (
            <p className="mt-2 text-xs text-black/50 dark:text-white/50">
              Seul un administrateur du club peut télécharger le document original.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-black/50 dark:text-white/50">
          Aucun document e-Marque récupéré pour l&apos;instant — ce n&apos;est pas une erreur, la récupération
          automatique réessaiera régulièrement une fois le match terminé.
        </p>
      )}

      {match.emarque.qualityWarningCount !== null && match.emarque.qualityWarningCount > 0 ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {isAdmin
            ? `Import réussi avec ${match.emarque.qualityWarningCount} avertissement(s) — vérification recommandée.`
            : "Certaines informations de ce match sont en cours de vérification par un administrateur."}
        </p>
      ) : null}
    </Card>
  );
}
