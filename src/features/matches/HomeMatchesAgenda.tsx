import Link from "next/link";
import type { MatchListItemDto } from "@/lib/api/matches";
import { MatchTitle, derogationBadge, matchDateParts, matchResultLabel } from "./match-display";

/**
 * "Pour les matchs à domicile, faut faire 2 colonnes car là il y a 2
 * gymnases pour le club de sète. Je veux un rendu type agenda carré propre
 * premium" (demande du club, 2026-09-28).
 *
 * Les 2 gymnases réels du club, confirmés par les données réelles (jamais
 * devinés — requête SQL sur `matches.venue_raw_label` pour les matchs à
 * domicile de SC Sète Basket, 2026-09-28) : GYMNASE MAURICE CLAVEL (67
 * matchs) et COMPLEXE SPORTIF DU LIDO (9 matchs). Une poignée de matchs
 * "à domicile" pointent vers d'autres salles (GYMNASE LE HETET, PALAIS DES
 * SPORTS, SALLE THOMAS BARONCHELLI) avec un adversaire ET une équipe Sète
 * inconnue — a priori une particularité FFBB (plateau/salle de repli) plutôt
 * qu'une 3e salle régulière du club ; ils sont regroupés dans "Autre salle"
 * plutôt que forcés dans l'une des 2 colonnes, pour ne jamais afficher une
 * fausse localisation.
 *
 * Le rapprochement se fait par mot-clé tolérant (normalisation des accents,
 * comme `venuesLikelyMatch` côté club-manager-api) plutôt que par égalité
 * stricte : `venueLabel` renvoyé par l'API peut différer en formatage de
 * `venue_raw_label` observé en base.
 */
const HOME_VENUES = [
  { key: "clavel", keyword: "CLAVEL", label: "Gymnase Maurice Clavel" },
  { key: "lido", keyword: "LIDO", label: "Complexe sportif du Lido" },
] as const;

/** Retire les diacritiques (accents) après décomposition NFD — évite tout souci d'échappement Unicode dans une regex. */
function normalizeVenue(label: string): string {
  let result = "";
  for (const char of label.normalize("NFD")) {
    const codePoint = char.codePointAt(0) ?? 0;
    const isCombiningMark = codePoint >= 0x0300 && codePoint <= 0x036f;
    if (!isCombiningMark) result += char;
  }
  return result.toUpperCase();
}

function resolveVenueColumnKey(venueLabel: string | null): (typeof HOME_VENUES)[number]["key"] | "autre" {
  if (!venueLabel) return "autre";
  const normalized = normalizeVenue(venueLabel);
  const match = HOME_VENUES.find((venue) => normalized.includes(venue.keyword));
  return match?.key ?? "autre";
}

function AgendaTile({
  match,
  basePath,
  clubName,
  clubLogoUrl,
}: {
  match: MatchListItemDto;
  basePath: string;
  clubName: string;
  clubLogoUrl: string | null;
}) {
  const badge = derogationBadge(match.derogationStatus);
  const parts = matchDateParts(match.matchDatetime);

  return (
    <Link
      href={`${basePath}/${match.id}`}
      className="group flex aspect-square flex-col justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col leading-none">
          <span className="text-2xl font-bold text-black/90 dark:text-white/90">{parts?.day ?? "—"}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">{parts?.month ?? ""}</span>
        </div>
        {badge ? <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>{badge.label}</span> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium capitalize text-black/40 dark:text-white/40">{parts?.weekday ?? "Date à confirmer"}</span>
        <div className="text-sm font-medium text-black/90 dark:text-white/90">
          <MatchTitle clubName={match.teamName ?? clubName} clubLogoUrl={clubLogoUrl} opponentName={match.opponentName ?? "?"} opponentLogoUrl={match.opponentLogoUrl} isHome />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60">
        <span>{parts?.time ?? "Heure à confirmer"}</span>
        <span className="font-medium">{matchResultLabel(match)}</span>
      </div>
    </Link>
  );
}

function AgendaColumn({
  label,
  matches,
  basePath,
  clubName,
  clubLogoUrl,
}: {
  label: string;
  matches: MatchListItemDto[];
  basePath: string;
  clubName: string;
  clubLogoUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-black/5 px-4 py-2 dark:bg-white/10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">{label}</h2>
      </div>
      {matches.length === 0 ? (
        <p className="px-1 text-sm text-black/40 dark:text-white/40">Aucun match à domicile ici.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
          {matches.map((match) => (
            <AgendaTile key={match.id} match={match} basePath={basePath} clubName={clubName} clubLogoUrl={clubLogoUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Rendu "agenda carré" des matchs à domicile, 2 colonnes (une par gymnase du
 * club) + une 3e colonne repliée uniquement si des matchs "autre salle"
 * existent réellement (jamais affichée vide).
 */
export function HomeMatchesAgenda({
  matches,
  basePath,
  clubName,
  clubLogoUrl,
}: {
  matches: MatchListItemDto[];
  /** Préfixe des liens vers la fiche match — `/c/{clubSlug}/matchs` (vue admin) ou `/public/{clubSlug}/matchs` (vue publique sans compte, retour du club, 2026-09-29). */
  basePath: string;
  clubName: string;
  clubLogoUrl: string | null;
}) {
  const columns = HOME_VENUES.map((venue) => ({
    ...venue,
    matches: matches.filter((match) => resolveVenueColumnKey(match.venueLabel) === venue.key),
  }));
  const autreMatches = matches.filter((match) => resolveVenueColumnKey(match.venueLabel) === "autre");

  return (
    <div className={`grid grid-cols-1 gap-6 ${autreMatches.length > 0 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
      {columns.map((column) => (
        <AgendaColumn key={column.key} label={column.label} matches={column.matches} basePath={basePath} clubName={clubName} clubLogoUrl={clubLogoUrl} />
      ))}
      {autreMatches.length > 0 ? (
        <AgendaColumn label="Autre salle" matches={autreMatches} basePath={basePath} clubName={clubName} clubLogoUrl={clubLogoUrl} />
      ) : null}
    </div>
  );
}
