/** Rappel de la connexion Safari (ASWebAuthenticationSession) — module PUR, testé. */
export const APP_CALLBACK_SCHEME = "fr.ballmanager.app";
export const APP_CALLBACK = `${APP_CALLBACK_SCHEME}://auth/callback`;

export class SsoCancelled extends Error {}

/** Lit le rappel de Safari : le `state` DOIT être celui envoyé (sinon rejet). */
export function parseCallback(url: string, expectedState: string): { code: string } {
  const parsed = new URL(url);
  const params = parsed.searchParams;
  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== APP_CALLBACK) throw new Error("Rappel inattendu.");
  if (params.get("state") !== expectedState) throw new Error("Réponse de connexion invalide (state).");
  if (params.get("error")) throw new SsoCancelled(params.get("error") ?? "cancelled");
  const code = params.get("code");
  if (!code) throw new Error("Réponse de connexion invalide (code manquant).");
  return { code };
}

