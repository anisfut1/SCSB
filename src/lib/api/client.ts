import { CLUB_MANAGER_API_URL } from "./config";
import { ApiError, ApiUnreachableError, toApiError } from "./errors";

export interface ApiRequestInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Jeton d'accès Supabase (JWT) à transmettre en `Authorization: Bearer <token>` — jamais un mot de passe, jamais la service role (§6 de la demande). */
  accessToken?: string | null;
}

/**
 * `fetch()` seul n'a aucun délai d'expiration : un club-manager-api lent ou
 * injoignable bloque indéfiniment la Server Action/le Server Component
 * appelant, jusqu'à ce que Vercel tue la Function avec un
 * `504 FUNCTION_INVOCATION_TIMEOUT` générique (page d'erreur opaque,
 * aucun détail exploitable). Ce délai transforme ça en `ApiUnreachableError`
 * rapide et explicite. Respecte un `signal` déjà fourni par l'appelant s'il
 * y en a un (rare aujourd'hui), sans jamais l'écraser silencieusement.
 */
const API_FETCH_TIMEOUT_MS = 8_000;

function withTimeout(signal: AbortSignal | null | undefined): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(API_FETCH_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

/**
 * Client HTTP central (§5 de la demande) : UN SEUL point d'appel réseau
 * vers club-manager-api, isomorphe (fonctionne identiquement en Server
 * Component et en Client Component) — jamais un `fetch()` dispersé dans un
 * composant. `T` est laissé au type généré (`components["schemas"][...]`)
 * par les modules de src/lib/api/*.ts, jamais deviné à la main.
 */
export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { accessToken, body, headers, ...rest } = init;
  const url = new URL(path, CLUB_MANAGER_API_URL);

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Données multi-tenant/authentifiées : jamais mises en cache par
      // défaut (§41 de la demande) — un club ne doit jamais recevoir une
      // réponse mise en cache pour un autre club.
      cache: rest.cache ?? "no-store",
      signal: withTimeout(rest.signal),
    });
  } catch (error) {
    throw new ApiUnreachableError(error);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Type d'une fonction d'appel déjà liée à un jeton d'accès (serveur ou navigateur, voir server.ts / browserClient.ts). */
export type ApiFetcher = <T>(path: string, init?: Omit<ApiRequestInit, "accessToken">) => Promise<T>;

export { ApiError, ApiUnreachableError };
