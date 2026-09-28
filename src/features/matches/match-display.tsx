import type { MatchListItemDto } from "@/lib/api/matches";

/**
 * Petit logo rond (club ou adverse) — `null` accepté (venue/logo pas toujours connus côté FFBB) :
 * dans ce cas un simple espace réservé neutre évite de casser l'alignement "Sète vs X".
 *
 * Partagé entre la liste "Matchs" (matchs/page.tsx) et l'agenda "Matchs à domicile"
 * (HomeMatchesAgenda.tsx) pour ne pas dupliquer cette logique d'affichage.
 */
export function TeamBadge({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span className="h-5 w-5 shrink-0 rounded-full bg-black/10 dark:bg-white/10" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- logos hébergés par api.ffbb.app, hors domaines Next configurés
  return <img src={src} alt={alt} className="h-5 w-5 shrink-0 rounded-full object-contain" />;
}

/** Titre visuel "Sète vs X" / "X vs Sète" avec les deux logos, dans l'ordre domicile/extérieur. */
export function MatchTitle({
  clubName,
  clubLogoUrl,
  opponentName,
  opponentLogoUrl,
  isHome,
}: {
  clubName: string;
  clubLogoUrl: string | null;
  opponentName: string;
  opponentLogoUrl: string | null;
  isHome: boolean;
}) {
  const club = { name: clubName, logoUrl: clubLogoUrl };
  const opponent = { name: opponentName, logoUrl: opponentLogoUrl };
  const [left, right] = isHome ? [club, opponent] : [opponent, club];
  return (
    <span className="flex items-center gap-2">
      <TeamBadge src={left.logoUrl} alt={left.name} />
      <span>
        {left.name} vs {right.name}
      </span>
      <TeamBadge src={right.logoUrl} alt={right.name} />
    </span>
  );
}

export function formatMatchDateTime(value: string | null): string {
  if (!value) return "Date à confirmer";
  // `timeZone` explicite (jamais le fuseau ambiant du runtime, UTC côté
  // serveur Vercel) — demande du club, 2026-09-27 : "elle est a 18h sur
  // notre outil" alors que FBI/FFBB disent 20h, `match_datetime` stocké
  // (correctement, en UTC) affichait son heure UTC brute faute de
  // conversion. Le basket français n'existe qu'en France : toujours
  // Europe/Paris, jamais le fuseau du club ou du serveur.
  return new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Jour/mois/heure Europe/Paris séparés, pour la tuile agenda (gros numéro de jour + heure isolée). */
export function matchDateParts(value: string | null): { weekday: string; day: string; month: string; time: string } | null {
  if (!value) return null;
  const date = new Date(value);
  const timeZone = "Europe/Paris";
  return {
    weekday: date.toLocaleString("fr-FR", { timeZone, weekday: "short" }),
    day: date.toLocaleString("fr-FR", { timeZone, day: "2-digit" }),
    month: date.toLocaleString("fr-FR", { timeZone, month: "short" }),
    time: date.toLocaleString("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Badge coloré par état — demande du club, 2026-09-27 : "faut faire par
 * couleur. acceptée = vert en cours = orange refusée = rouge". `null`
 * (aucune dérogation connue, ou seulement "A Créer", du bruit) -> aucun
 * badge.
 */
export function derogationBadge(status: MatchListItemDto["derogationStatus"]): { label: string; className: string } | null {
  switch (status) {
    case "en_cours":
      return { label: "Dérog en cours", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" };
    case "acceptee":
      return { label: "Dérog acceptée", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" };
    case "refusee":
      return { label: "Dérog refusée", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" };
    default:
      return null;
  }
}

/** Résultat/statut affiché sous une rencontre (score si connu, sinon report/annulation/forfait/à venir). */
export function matchResultLabel(match: Pick<MatchListItemDto, "scoreHome" | "scoreAway" | "status">): string {
  if (match.scoreHome !== null && match.scoreAway !== null) return `${match.scoreHome} - ${match.scoreAway}`;
  switch (match.status) {
    case "postponed":
      return "Reporté";
    case "cancelled":
      return "Annulé";
    case "forfeit":
      return "Forfait";
    default:
      return "À venir";
  }
}
