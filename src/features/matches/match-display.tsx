import type { ReactNode } from "react";
import { Ban, CalendarX2, CheckCircle2, Flag, Hourglass, House, Route, XCircle } from "lucide-react";
import type { BadgeTone } from "@/components/ui/Badge";
import type { MatchListItemDto } from "@/lib/api/matches";

const PARIS = "Europe/Paris";

export function formatMatchDateTime(value: string | null): string {
  if (!value) return "Date à confirmer";
  // `timeZone` explicite (jamais le fuseau ambiant du runtime, UTC côté
  // serveur Vercel) — demande du club, 2026-09-27 : "elle est a 18h sur
  // notre outil" alors que FBI/FFBB disent 20h, `match_datetime` stocké
  // (correctement, en UTC) affichait son heure UTC brute faute de
  // conversion. Le basket français n'existe qu'en France : toujours
  // Europe/Paris, jamais le fuseau du club ou du serveur.
  return new Date(value).toLocaleString("fr-FR", { timeZone: PARIS, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Date longue (fiche match) : « samedi 4 octobre 2026 ». */
export function formatMatchLongDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("fr-FR", { timeZone: PARIS, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Jour/mois/heure Europe/Paris séparés, pour les tuiles (gros numéro de jour + heure isolée). */
export function matchDateParts(value: string | null): { weekday: string; day: string; month: string; time: string } | null {
  if (!value) return null;
  const date = new Date(value);
  return {
    weekday: date.toLocaleString("fr-FR", { timeZone: PARIS, weekday: "short" }).replace(".", ""),
    day: date.toLocaleString("fr-FR", { timeZone: PARIS, day: "2-digit" }),
    month: date.toLocaleString("fr-FR", { timeZone: PARIS, month: "short" }).replace(".", ""),
    time: date.toLocaleString("fr-FR", { timeZone: PARIS, hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Badge par état de dérogation — demande du club, 2026-09-27 : "faut faire
 * par couleur. acceptée = vert en cours = orange refusée = rouge" (+ icône,
 * jamais la couleur seule). `null` (aucune dérogation connue, ou seulement
 * "A Créer", du bruit) -> aucun badge.
 */
export function derogationBadge(status: MatchListItemDto["derogationStatus"]): { label: string; tone: BadgeTone; icon: ReactNode } | null {
  switch (status) {
    case "en_cours":
      return { label: "Dérog en cours", tone: "warning", icon: <Hourglass /> };
    case "acceptee":
      return { label: "Dérog acceptée", tone: "success", icon: <CheckCircle2 /> };
    case "refusee":
      return { label: "Dérog refusée", tone: "danger", icon: <XCircle /> };
    default:
      return null;
  }
}

/** Statut exceptionnel d'une rencontre (reporté/annulé/forfait) — `null` pour un match normal. */
export function matchStatusBadge(status: MatchListItemDto["status"]): { label: string; tone: BadgeTone; icon: ReactNode } | null {
  switch (status) {
    case "postponed":
      return { label: "Reporté", tone: "warning", icon: <CalendarX2 /> };
    case "cancelled":
      return { label: "Annulé", tone: "danger", icon: <Ban /> };
    case "forfeit":
      return { label: "Forfait", tone: "danger", icon: <Flag /> };
    default:
      return null;
  }
}

/** Domicile/extérieur : icône + libellé (jamais la couleur seule). */
export function sideBadge(isHome: boolean | null): { label: string; tone: BadgeTone; icon: ReactNode } | null {
  if (isHome === true) return { label: "Domicile", tone: "accent", icon: <House /> };
  if (isHome === false) return { label: "Extérieur", tone: "neutral", icon: <Route /> };
  return null;
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

/** Issue pour le club (lecture directe des deux scores connus) — `null` si score ou côté inconnu. */
export function matchOutcome(match: Pick<MatchListItemDto, "scoreHome" | "scoreAway" | "isHome">): "win" | "loss" | "draw" | null {
  if (match.scoreHome === null || match.scoreAway === null || match.isHome === null) return null;
  const ours = match.isHome ? match.scoreHome : match.scoreAway;
  const theirs = match.isHome ? match.scoreAway : match.scoreHome;
  if (ours > theirs) return "win";
  if (ours < theirs) return "loss";
  return "draw";
}

/** « 5 » → « Journée 5 » ; libellé brut conservé sinon. */
export function journeeLabel(journee: string | null): string | null {
  if (!journee) return null;
  return /^\d+$/.test(journee.trim()) ? `Journée ${journee.trim()}` : journee;
}
