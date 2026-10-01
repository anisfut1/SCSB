import { redirect } from "next/navigation";

/** `/public/{slug}` seul : accueil personnel (retour du club, 2026-10-01 — agenda du coach, équipe du joueur). */
export default async function PublicClubIndex({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  redirect(`/public/${clubSlug}/accueil`);
}
