import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getPublicClub, type PublicClubDto } from "@/lib/api/publicTables";
import { ApiError } from "@/lib/api/client";
import { PublicShell } from "@/components/public/PublicShell";

/**
 * Layout commun de l'espace public sans compte : résout le club une fois
 * (404 si slug inconnu/suspendu) et pose le shell public (onglets + barre
 * du bas, retour du club, 2026-10-01). Volontairement HORS de
 * `/c/[clubSlug]` : `/public` est listé dans `PUBLIC_PATHS` (src/config/site.ts).
 */
export default async function PublicClubLayout({ children, params }: { children: ReactNode; params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  let club: PublicClubDto;
  try {
    club = await getPublicClub(clubSlug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  return (
    <PublicShell clubSlug={clubSlug} club={{ name: club.name, logoUrl: club.logoUrl, accentColor: club.accentColor }}>
      {children}
    </PublicShell>
  );
}
