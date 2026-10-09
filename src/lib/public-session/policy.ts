import type { SessionPayload } from "./seal";

/**
 * Politique de la session persistante de l'espace public (module PUR).
 *
 * Durée : 90 jours GLISSANTS (renouvelés au plus une fois par jour à chaque
 * ouverture), plafonnés à 365 jours depuis la première émission : une
 * personne qui ouvre l'appli chaque semaine n'a jamais à retrouver son lien,
 * mais un appareil abandonné finit par être oublié.
 */
export const SESSION_COOKIE = "bm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
export const SESSION_ABSOLUTE_MAX_MS = 1000 * 60 * 60 * 24 * 365;
export const SESSION_RENEW_AFTER_MS = 1000 * 60 * 60 * 24;
export const MAX_SESSION_TOKENS = 8;
export const CSRF_HEADER = "x-bm-csrf";

export function sessionPath(clubSlug: string): string {
  return `/public/${clubSlug}`;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/i.test(slug);
}

export function isPlausibleToken(token: unknown): token is string {
  return typeof token === "string" && token.length >= 8 && token.length <= 512 && /^[\x21-\x7e]+$/.test(token);
}

/** Secret de scellage ; `null` si non configuré (fonctionnalité alors désactivée, le front garde son repli actuel). */
export function sessionSecret(env: Record<string, string | undefined> = process.env): string | null {
  const secret = env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function sessionEpoch(env: Record<string, string | undefined> = process.env): string {
  return env.SESSION_EPOCH ?? "1";
}

/** Une session est valide pour CE club, cette époque, et n'a pas dépassé ses durées. */
export function isSessionLive(session: SessionPayload, slug: string, epoch: string, now: number): boolean {
  return (
    session.slug === slug &&
    session.epoch === epoch &&
    now - session.firstIssuedAt < SESSION_ABSOLUTE_MAX_MS &&
    now - session.issuedAt < SESSION_MAX_AGE_SECONDS * 1000
  );
}

export function needsRenewal(session: SessionPayload, now: number): boolean {
  return now - session.issuedAt >= SESSION_RENEW_AFTER_MS;
}

/** Remet `active` en tête, sans doublon, plafonné. */
export function mergeTokens(existing: readonly string[], incoming: readonly string[], active?: string): string[] {
  const merged = [...new Set([...(active ? [active] : []), ...incoming, ...existing])];
  return merged.slice(0, MAX_SESSION_TOKENS);
}

/**
 * Anti-CSRF des endpoints de session : en-tête personnalisé obligatoire (un
 * formulaire ou une balise d'un autre site ne peut pas le poser, et un appel
 * `fetch` cross-origin déclencherait un préflight que nous ne validons pas),
 * `Origin` identique à l'hôte, et `Sec-Fetch-Site` jamais `cross-site`.
 */
export function isSameOriginRequest(headers: Headers, requestUrl: string): boolean {
  if (headers.get(CSRF_HEADER) !== "1") return false;
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = headers.get("origin");
  if (origin && origin !== new URL(requestUrl).origin) return false;
  return true;
}
