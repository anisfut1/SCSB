/**
 * sanitize.ts — garde-fous anti-fuite de données personnelles.
 *
 * Fonctions pures, sans dépendance à Playwright, volontairement séparées de
 * la capture réseau : c'est le SEUL endroit du spike qui décide ce qui a le
 * droit d'être écrit sur disque. Toute donnée qui transite par ici doit déjà
 * être structurelle (URLs, méthodes, noms de champs, statuts, tailles) —
 * jamais des valeurs de formulaire, cookies ou en-têtes d'authentification.
 *
 * Principe : mieux vaut un faux positif qui bloque l'écriture du rapport
 * qu'un faux négatif qui laisse fuiter une donnée personnelle.
 */

/** En-têtes qui ne doivent JAMAIS apparaître, même par erreur, dans un rapport. */
export const FORBIDDEN_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-csrf-token",
  "csrf-token",
  "x-xsrf-token",
]);

export function isForbiddenHeaderName(name: string): boolean {
  return FORBIDDEN_HEADER_NAMES.has(name.toLowerCase());
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const FRENCH_PHONE_RE = /\b0[1-9](?:[ .\-]?\d{2}){4}\b/;
// Suite de 6 chiffres ou plus : capture large (numéro de licence, de
// téléphone, id interne...). Beaucoup de faux positifs attendus (ex: un id
// de rencontre) — c'est voulu, voir le principe ci-dessus.
const LONG_DIGIT_RUN_RE = /\b\d{6,}\b/;
// Date de naissance plausible (jj/mm/aaaa ou aaaa-mm-jj).
const DATE_LIKE_RE = /\b(?:\d{2}[/.-]\d{2}[/.-](?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}-\d{2})\b/;

export type SuspiciousPatternKind = "email" | "french_phone" | "long_digit_run" | "date_like";

export interface SuspiciousMatch {
  kind: SuspiciousPatternKind;
  sample: string;
}

/**
 * Cherche des motifs qui ressemblent à des données personnelles dans un
 * texte. Ne redacte rien : signale seulement, pour que l'appelant décide de
 * refuser l'écriture plutôt que de corriger silencieusement (un correctif
 * silencieux masquerait un bug réel de la capture réseau).
 */
export function findSuspiciousPatterns(text: string): SuspiciousMatch[] {
  const matches: SuspiciousMatch[] = [];

  const email = text.match(EMAIL_RE);
  if (email) matches.push({ kind: "email", sample: redactSample(email[0]) });

  const phone = text.match(FRENCH_PHONE_RE);
  if (phone) matches.push({ kind: "french_phone", sample: redactSample(phone[0]) });

  const digits = text.match(LONG_DIGIT_RUN_RE);
  if (digits) matches.push({ kind: "long_digit_run", sample: redactSample(digits[0]) });

  const date = text.match(DATE_LIKE_RE);
  if (date) matches.push({ kind: "date_like", sample: redactSample(date[0]) });

  return matches;
}

/** Ne jamais logger la valeur trouvée en clair, même dans un message d'erreur. */
function redactSample(value: string): string {
  if (value.length <= 4) return "*".repeat(value.length);
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}

/**
 * Dernière barrière avant d'écrire un rapport sur disque : sérialise l'objet
 * et vérifie l'absence de motifs suspects. Lève une erreur (n'écrit rien) si
 * quelque chose ressemble à une donnée personnelle.
 */
export function assertReportIsClean(report: unknown): void {
  const serialized = JSON.stringify(report);
  const hits = findSuspiciousPatterns(serialized);

  if (hits.length > 0) {
    const summary = hits.map((h) => `${h.kind} (${h.sample})`).join(", ");
    throw new Error(
      `Rapport potentiellement non sanitisé : motifs suspects détectés — ${summary}. ` +
        "Le rapport n'a PAS été écrit sur disque. Vérifie la capture réseau " +
        "(URL, paramètres, noms de fichiers téléchargés) avant de relancer.",
    );
  }
}

/**
 * Retire la VALEUR des paramètres de requête d'une URL, en ne gardant que
 * leurs noms (ex: ?nom=Dupont&prenom=Jean -> ?nom=<redacted>&prenom=<redacted>).
 * Le path lui-même n'est pas modifié : si un identifiant se trouve dans le
 * path (ex: /licencie/12345), il ne sera pas retiré ici — c'est à ça que sert
 * la détection de motifs suspects en dernier recours (assertReportIsClean).
 */
export function redactUrlQueryValues(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const redacted = new URLSearchParams();
  for (const key of parsed.searchParams.keys()) {
    redacted.set(key, "<redacted>");
  }
  parsed.search = redacted.toString();
  return parsed.toString();
}

/**
 * Extrait uniquement les NOMS des paramètres d'un corps de requête POST,
 * jamais leurs valeurs. Gère les deux formats les plus courants pour un
 * webapp Java classique (form-urlencoded) et les APIs modernes (JSON).
 */
export function extractPostParamNames(postData: string | null, contentType: string | undefined): string[] {
  if (!postData) return [];

  try {
    if (contentType?.includes("application/json")) {
      const parsed: unknown = JSON.parse(postData);
      return flattenKeys(parsed);
    }

    // Par défaut, tente un parsing form-urlencoded (cas le plus probable
    // pour une application Java historique de type FBI).
    const params = new URLSearchParams(postData);
    return [...new Set([...params.keys()])];
  } catch {
    return ["<corps illisible, ignoré>"];
  }
}

function flattenKeys(value: unknown, prefix = "", depth = 0): string[] {
  if (depth > 2 || value === null || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }

  const keys: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
      keys.push(...flattenKeys(nested, path, depth + 1));
    } else {
      keys.push(path);
    }
  }
  return keys;
}
