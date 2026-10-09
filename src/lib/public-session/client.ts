/**
 * Client navigateur de `/public/{slug}/session` (cookie HttpOnly côté serveur).
 * Chaque fonction est tolérante : si la session serveur est indisponible
 * (SESSION_SECRET absent, réseau coupé, cookies bloqués), elle renvoie `null`/
 * `false` et l'appelant retombe sur le comportement `localStorage` d'avant.
 * Le jeton reste en mémoire de la page, jamais écrit dans un stockage JS.
 */

const headers = { "Content-Type": "application/json", "x-bm-csrf": "1" };
const url = (clubSlug: string) => `/public/${encodeURIComponent(clubSlug)}/session`;

/** Jetons de la session de ce club, ou `null` si la session serveur est indisponible. */
export async function fetchSessionTokens(clubSlug: string): Promise<string[] | null> {
  try {
    const res = await fetch(url(clubSlug), { headers: { "x-bm-csrf": "1" }, credentials: "same-origin", cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { tokens?: unknown };
    return Array.isArray(data.tokens) ? data.tokens.filter((t): t is string => typeof t === "string") : null;
  } catch {
    return null;
  }
}

/** Enregistre des jetons (validés côté serveur). `true` si la session a été écrite. */
export async function saveSessionTokens(clubSlug: string, tokens: readonly string[], active?: string): Promise<boolean> {
  try {
    const res = await fetch(url(clubSlug), { method: "POST", headers, credentials: "same-origin", body: JSON.stringify({ tokens, active }) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Retire ces jetons de la session, ou la session entière si `tokens` est omis (déconnexion). */
export async function dropSessionTokens(clubSlug: string, tokens?: readonly string[]): Promise<void> {
  try {
    await fetch(url(clubSlug), { method: "DELETE", headers, credentials: "same-origin", body: JSON.stringify({ tokens }) });
  } catch {
    // Hors ligne : le cookie expirera, et le jeton révoqué est refusé par l'API de toute façon.
  }
}
