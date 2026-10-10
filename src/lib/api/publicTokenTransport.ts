import { apiFetch, type ApiRequestInit } from "./client";

/**
 * Transport du jeton personnel public vers `club-manager-api` (R-014, ADR-006
 * addendum 2026-10-07) : UN seul endroit décide si le jeton voyage en query
 * string (`?token=`, comportement d'origine) ou en en-tête.
 *
 * Le mode en-tête est derrière `NEXT_PUBLIC_PUBLIC_TOKEN_HEADER=1`
 * (DÉFAUT = query). Ne l'activer qu'APRÈS que `club-manager-api` accepte
 * `X-Personal-Link-Token` ET l'autorise en CORS (`Access-Control-Allow-Headers`) :
 * un en-tête personnalisé déclenche un préflight, et sans cela chaque appel
 * public échouerait. `Authorization` n'est pas utilisé (réservé au JWT Supabase).
 */
export const PUBLIC_TOKEN_HEADER = "X-Personal-Link-Token";

export function publicTokenHeaderEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PUBLIC_TOKEN_HEADER === "1";
}

export interface PublicFetchInit extends ApiRequestInit {
  /** Paramètres de query autres que le jeton (les valeurs `undefined` sont omises). */
  query?: Record<string, string | undefined>;
}

/**
 * App iOS (docs/IOS_AUDIT.md §6) : l'app n'a jamais le jeton personnel, elle
 * a une session d'appareil. Ses « jetons » sont des références `as:<licencieId>`
 * que ce transport traduit en en-têtes (`Authorization: Bearer bmd_…`,
 * `X-BM-As`). Rien n'est enregistré côté web : comportement inchangé.
 */
export type PublicCredentialTransport = (token: string) => Record<string, string> | null;
let credentialTransport: PublicCredentialTransport | null = null;

export function setPublicCredentialTransport(transport: PublicCredentialTransport | null): void {
  credentialTransport = transport;
}

/** En-têtes de session (app iOS) pour les routes qui reçoivent plusieurs références dans le corps (`tokens`). `undefined` sur le web. */
export function credentialHeadersFor(tokens: readonly string[]): Record<string, string> | undefined {
  const first = tokens[0];
  return (first && credentialTransport?.(first)) || undefined;
}

export function publicFetch<T>(path: string, token: string, init: PublicFetchInit = {}): Promise<T> {
  const { query = {}, headers, ...rest } = init;
  const credential = credentialTransport?.(token) ?? null;
  if (credential) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined) search.set(key, value);
    const qs = search.toString();
    const requestHeaders = new Headers(headers);
    for (const [key, value] of Object.entries(credential)) requestHeaders.set(key, value);
    return apiFetch<T>(qs ? `${path}?${qs}` : path, { ...rest, headers: requestHeaders });
  }
  const useHeader = publicTokenHeaderEnabled();

  const search = new URLSearchParams(useHeader ? {} : { token });
  for (const [key, value] of Object.entries(query)) if (value !== undefined) search.set(key, value);
  const qs = search.toString();

  const requestHeaders = new Headers(headers);
  if (useHeader) requestHeaders.set(PUBLIC_TOKEN_HEADER, token);

  return apiFetch<T>(qs ? `${path}?${qs}` : path, { ...rest, headers: requestHeaders });
}
