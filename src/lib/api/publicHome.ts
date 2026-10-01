import { apiFetch } from "./client";
import type { components } from "./generated/schema";

/** Accueil personnel de l'espace public (lien personnel `?token=`, jamais de jeton Supabase). */
export type PublicHomeDto = components["schemas"]["PublicHomeDto"];
export type HomeRelation = components["schemas"]["HomeRelation"];

export function getPublicHome(clubSlug: string, token: string): Promise<PublicHomeDto> {
  return apiFetch<PublicHomeDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/home?token=${encodeURIComponent(token)}`);
}
