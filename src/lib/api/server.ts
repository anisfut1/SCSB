import "server-only";
import { apiFetch, type ApiRequestInit } from "./client";
import { getServerAccessToken } from "./auth.server";
import { createApi } from "./factory";

/**
 * Utilisé par les Server Components / Server Actions (§8 de la demande) :
 * `import { api } from "@/lib/api/server"`. Le jeton d'accès est lu depuis
 * la session Supabase serveur à CHAQUE appel (jamais mis en cache entre
 * requêtes, cohérent avec `cache: "no-store"` de src/lib/api/client.ts).
 */
async function serverFetcher<T>(path: string, init: Omit<ApiRequestInit, "accessToken"> = {}): Promise<T> {
  const accessToken = await getServerAccessToken();
  return apiFetch<T>(path, { ...init, accessToken });
}

export const api = createApi(serverFetcher);
