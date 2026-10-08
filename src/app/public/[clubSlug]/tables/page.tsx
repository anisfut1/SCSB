import { getPublicClub } from "@/lib/api/publicTables";
import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
import { PageContainer } from "@/components/ui/PageHeader";
import { PublicTablesApp } from "@/features/public-tables/PublicTablesApp";

/**
 * Onglet Tables de l'espace public sans compte (retour du club,
 * 2026-09-29) — le club est déjà validé par le layout (404 sinon). Toute
 * la logique (identification, tableau) vit côté client.
 */
export default async function PublicTablesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await getPublicClub(clubSlug);

  return (
    <PageContainer width="wide">
      {/* Classement visible de tous, même sans être identifié (retour du club, 2026-10-08). */}
      <Link href={`/public/${clubSlug}/tables/classement`} className="surface-card group flex items-center gap-3 p-3 transition-colors hover:bg-surface-muted">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E7B416]/15 text-[#a37c00]">
          <Trophy aria-hidden className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-foreground">Classement des tables</span>
          <span className="type-meta block truncate">Le top 3 de la saison et tout le classement</span>
        </span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-subtle group-hover:text-accent-text" />
      </Link>
      <PublicTablesApp clubSlug={clubSlug} clubTimezone={club.timezone} />
    </PageContainer>
  );
}
