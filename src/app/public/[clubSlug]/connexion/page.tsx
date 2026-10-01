import type { Metadata } from "next";
import { PublicLoginApp } from "@/features/public/PublicLoginApp";

export const metadata: Metadata = { title: "Connexion" };

/** Connexion de l'espace public sans compte (retour du club, 2026-10-01) — nom → email → accueil. */
export default async function PublicLoginPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  return <PublicLoginApp clubSlug={clubSlug} />;
}
