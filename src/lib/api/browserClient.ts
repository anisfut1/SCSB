"use client";

import { apiFetch, ApiError, type ApiRequestInit } from "./client";
import { getBrowserAccessToken, refreshBrowserAccessToken } from "./auth.browser";
import { createApi } from "./factory";

/**
 * Rechargement complet volontaire (§42 de la demande : session expirée =
 * redirection franche, jamais une boucle) plutôt que `useRouter()` : cette
 * fonction est appelée depuis `browserFetcher`, en dehors de tout rendu ou
 * gestionnaire d'événement React où un hook serait utilisable.
 */
function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hors composant React, useRouter() indisponible ici (voir commentaire ci-dessus)
    window.location.assign("/login");
  }
}

/**
 * Utilisé par les Client Components (§7 de la demande) :
 * `import { browserApi } from "@/lib/api/browserClient"`. Sur un 401,
 * tente UNE fois un rafraîchissement de session Supabase puis rejoue la
 * requête ; si la session est réellement expirée, redirige vers /login —
 * jamais de boucle de retry (§42 de la demande).
 */
async function browserFetcher<T>(path: string, init: Omit<ApiRequestInit, "accessToken"> = {}): Promise<T> {
  const accessToken = await getBrowserAccessToken();

  try {
    return await apiFetch<T>(path, { ...init, accessToken });
  } catch (error) {
    if (!(error instanceof ApiError) || !error.isUnauthorized) {
      throw error;
    }

    const refreshedToken = await refreshBrowserAccessToken();
    if (!refreshedToken) {
      redirectToLogin();
      throw error;
    }

    try {
      return await apiFetch<T>(path, { ...init, accessToken: refreshedToken });
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.isUnauthorized) {
        redirectToLogin();
      }
      throw retryError;
    }
  }
}

export const browserApi = createApi(browserFetcher);
