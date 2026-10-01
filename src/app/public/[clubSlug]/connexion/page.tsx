import type { Metadata } from "next";
import { getPublicClub } from "@/lib/api/publicTables";
import { PublicLoginApp } from "@/features/public/PublicLoginApp";

export const metadata: Metadata = { title: "Connexion" };

/** Connexion de l'espace public sans compte (retour du club, 2026-10-01) — nom → email → accueil. */
export default async function PublicLoginPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);
  return <PublicLoginApp clubSlug={clubSlug} club={{ name: club.name, logoUrl: club.logoUrl }} />;
}
