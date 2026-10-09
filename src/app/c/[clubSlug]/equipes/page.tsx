import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Shirt } from "lucide-react";
import { requireClubContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { teamDisplayName } from "@/features/team-life/labels";

export const metadata: Metadata = { title: "Équipes" };

/** Équipes du club (Vie d'équipe, Lot 4) : accès à la page de chaque équipe. */
export default async function ClubTeamsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubContext(clubSlug);
  const teams = (await api.clubs.teams(club.id))
    .filter((t) => t.active)
    .map((t) => ({ id: t.id, name: teamDisplayName(t) }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  return (
    <PageContainer className="gap-6">
      <PageHeader eyebrow={club.name} title="Équipes" description="Prochain match, entraînements et effectif de chaque équipe." />
      {teams.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link href={`/c/${clubSlug}/equipes/${t.id}`} className="flex min-h-14 items-center gap-3 rounded-[14px] border border-border bg-surface-raised px-4 py-3 shadow-1 transition-colors hover:bg-surface-muted [&_svg]:size-4">
                <Shirt aria-hidden className="text-accent-text" />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">{t.name}</span>
                <ChevronRight aria-hidden className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Aucune équipe" description="Les équipes apparaissent après la synchronisation FFBB." />
      )}
    </PageContainer>
  );
}
