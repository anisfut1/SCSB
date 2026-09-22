import { CLUB_MANAGER_API_URL } from "./config";
import { ApiError, ApiUnreachableError, toApiError } from "./errors";

export interface ApiRequestInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Jeton d'accès Supabase (JWT) à transmettre en `Authorization: Bearer <token>` — jamais un mot de passe, jamais la service role (§6 de la demande). */
  accessToken?: string | null;
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
