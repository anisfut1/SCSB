import { Suspense } from "react";
import { getPublicClub, type PublicClubDto } from "@/lib/api/publicTables";
import { PublicFrame } from "@/components/public/PublicFrame";
import { PageContainer } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { PublicTablesApp } from "@/features/public-tables/PublicTablesApp";

/**
 * Route publique sans compte (retour du club, 2026-09-29) — volontairement
 * HORS de `/c/[clubSlug]` (protégé par `src/proxy.ts`) : `/public` est
 * listé dans `PUBLIC_PATHS` (voir src/config/site.ts). Toute la logique
 * (résolution du club, choix du nom, tableau) vit côté client dans
 * `PublicTablesApp` — cette page ne fournit que `clubSlug` et l'identité
 * visuelle du club pour l'en-tête (repli neutre si indisponible : l'app
 * affiche elle-même l'erreur).
 */
export default async function PublicTablesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  let club: PublicClubDto | null = null;
  try {
    club = await getPublicClub(clubSlug);
  } catch {
    club = null;
  }

  return (
    <PublicFrame club={club}>
      <PageContainer width="wide">
        <Suspense fallback={<ListSkeleton rows={4} />}>
          <PublicTablesApp clubSlug={clubSlug} />
        </Suspense>
      </PageContainer>
    </PublicFrame>
  );
}
