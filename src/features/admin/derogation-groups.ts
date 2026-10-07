import type { DerogationListItemDto } from "@/lib/api/derogations";

/**
 * Regroupement des dérogations FBI PAR MATCH — retour du club, 2026-10-07 :
 * "je veux avoir l'historique des dérogs en 1 carte pour 1 match, et pas 1
 * carte par-ci par-là, ça peut induire en erreur" (ex. rencontre 9608 : 3
 * dérogations dont 2 refusées, chacune dans sa propre carte).
 */
export interface DerogationMatchGroup {
  key: string;
  /** Dérogations de ce match : action requise d'abord, puis la plus récente en premier (dates FBI inconnues en dernier). */
  derogations: DerogationListItemDto[];
  /** Première ligne du groupe — porte les infos du match (numéro, équipe, adversaire, date FFBB). */
  match: DerogationListItemDto;
  actionRequired: boolean;
}

/** "jj/mm/aaaa" (format FBI) → horodatage, ou `null` si absent/illisible — jamais deviné. */
export function parseFbiDate(value: string | null | undefined): number | null {
  const match = value?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const time = Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(time) ? null : time;
}

/** Date la plus parlante d'une dérogation pour l'ordre chronologique : dépôt, sinon date de dérogation. */
function derogationTime(derogation: DerogationListItemDto): number | null {
  return parseFbiDate(derogation.dateDepot) ?? parseFbiDate(derogation.dateDerogation);
}

function compareDerogations(a: DerogationListItemDto, b: DerogationListItemDto): number {
  if (a.actionRequired !== b.actionRequired) return a.actionRequired ? -1 : 1;
  const ta = derogationTime(a);
  const tb = derogationTime(b);
  if (ta !== null && tb !== null) return tb - ta;
  if (ta !== null) return -1;
  if (tb !== null) return 1;
  return 0;
}

function groupKey(derogation: DerogationListItemDto): string {
  if (derogation.matchId) return `match:${derogation.matchId}`;
  if (derogation.numero) return `numero:${derogation.numero}`;
  return `derogation:${derogation.id}`;
}

/**
 * Un groupe par match (`matchId`, sinon numéro de rencontre, sinon la
 * dérogation seule). Ordre des groupes : action requise d'abord, puis match
 * le plus proche dans le temps en premier (date FFBB), comme la liste
 * d'origine sinon.
 */
export function groupDerogationsByMatch(derogations: DerogationListItemDto[]): DerogationMatchGroup[] {
  const byKey = new Map<string, DerogationListItemDto[]>();
  for (const derogation of derogations) {
    const key = groupKey(derogation);
    byKey.set(key, [...(byKey.get(key) ?? []), derogation]);
  }

  const groups: DerogationMatchGroup[] = Array.from(byKey.entries()).map(([key, items]) => {
    const sorted = [...items].sort(compareDerogations);
    return { key, derogations: sorted, match: sorted[0]!, actionRequired: sorted.some((d) => d.actionRequired) };
  });

  return groups.sort((a, b) => {
    if (a.actionRequired !== b.actionRequired) return a.actionRequired ? -1 : 1;
    const ta = a.match.matchDatetime ? Date.parse(a.match.matchDatetime) : NaN;
    const tb = b.match.matchDatetime ? Date.parse(b.match.matchDatetime) : NaN;
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta - tb;
    if (!Number.isNaN(ta)) return -1;
    if (!Number.isNaN(tb)) return 1;
    return 0;
  });
}

/** Résumé des états d'un match ("1 acceptée · 2 refusées") : libellés FBI tels quels, comptés. */
export function summarizeEtats(derogations: DerogationListItemDto[]): Array<{ etat: string; count: number }> {
  const counts = new Map<string, number>();
  for (const derogation of derogations) {
    const etat = derogation.etat ?? "État inconnu";
    counts.set(etat, (counts.get(etat) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([etat, count]) => ({ etat, count }));
}

/** Couleur d'un état FBI — uniquement sur les mots présents dans le libellé, neutre sinon. */
export function etatTone(etat: string | null | undefined): "success" | "danger" | "warning" | "neutral" {
  const value = (etat ?? "").toLowerCase();
  if (value.includes("refus")) return "danger";
  if (value.includes("accept")) return "success";
  if (value.includes("en cours")) return "warning";
  return "neutral";
}
