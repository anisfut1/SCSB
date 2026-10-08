import { publicFetch } from "./publicTokenTransport";
import type { components } from "./generated/schema";

/** Accueil personnel de l'espace public (lien personnel, jamais de jeton Supabase). */
export type PublicHomeDto = components["schemas"]["PublicHomeDto"];
export type HomeRelation = components["schemas"]["HomeRelation"];

export function getPublicHome(clubSlug: string, token: string): Promise<PublicHomeDto> {
  return publicFetch<PublicHomeDto>(`/v1/public/clubs/${encodeURIComponent(clubSlug)}/home`, token);
}
