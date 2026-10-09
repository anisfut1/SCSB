import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { KNOWN_COOKIE } from "@/features/public/known-cookie";
import { SESSION_COOKIE } from "@/lib/public-session/policy";

/**
 * `/public/{slug}` seul : un licencié déjà reconnu sur ce navigateur (marqueur
 * posé par `PublicIdentityProvider`, jamais le jeton) arrive sur son accueil ;
 * tous les autres — robots d'indexation compris — sur les résultats publics.
 * Rien n'impose de se connecter (retour du club, 2026-10-01, SEO).
 */
export default async function PublicClubIndex({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const jar = await cookies();
  // Session persistante (cookie HttpOnly, limité à ce club) ou marqueur posé par le navigateur.
  const known = jar.has(SESSION_COOKIE) || jar.get(KNOWN_COOKIE)?.value === "1";
  redirect(`/public/${clubSlug}/${known ? "accueil" : "resultats"}`);
}
