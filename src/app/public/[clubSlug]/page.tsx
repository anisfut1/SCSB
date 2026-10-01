import { redirect } from "next/navigation";

/** `/public/{slug}` seul : l'onglet Matchs est l'accueil de l'espace public. */
export default async function PublicClubIndex({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  redirect(`/public/${clubSlug}/matchs`);
}
