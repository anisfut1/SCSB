import { PublicEntryRedirect } from "@/features/public/PublicLoginApp";

/**
 * `/public/{slug}` seul — le lien commun à distribuer : déjà reconnu → accueil
 * personnel, sinon → page de connexion (retour du club, 2026-10-01).
 */
export default async function PublicClubIndex({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  return <PublicEntryRedirect clubSlug={clubSlug} />;
}
