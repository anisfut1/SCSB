import { Building2, Palette } from "lucide-react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ClubSettingsForm } from "@/features/admin/ClubSettingsForm";
import { ClubAppearanceForm } from "@/features/admin/ClubAppearanceForm";
import type { ReactNode } from "react";

function SettingsSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-border pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="type-section flex items-center gap-2 text-foreground">
          <span aria-hidden className="inline-flex text-accent-text [&_svg]:size-4">
            {icon}
          </span>
          {title}
        </h2>
        <p className="type-meta">{description}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * Réglages du club (§42 du brief SaaS) : uniquement le branding léger
 * (nom, nom court, fuseau horaire) — écriture inchangée via
 * `updateClubSettingsAction` (voir docs/MIGRATION_TO_API.md, catégorie D).
 * L'apparence (logo, couleur d'accent) passe par PATCH /v1/clubs/:clubId
 * (`ClubAppearanceForm`, retour du club 2026-10-01).
 */
export default async function ClubSettingsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Administration" title="Réglages du club" description="Identité et apparence de l'espace club." />

      <div className="flex flex-col gap-8">
        <SettingsSection icon={<Building2 />} title="Identité du club" description="Nom affiché partout dans l'application et fuseau horaire de référence.">
          <Card>
            <ClubSettingsForm clubSlug={clubSlug} name={club.name} shortName={club.shortName} timezone={club.timezone} />
          </Card>
        </SettingsSection>

        <SettingsSection icon={<Palette />} title="Apparence" description="Logo affiché en haut à gauche et sur les cartes de match, et couleur d'accent de l'interface.">
          <Card>
            <ClubAppearanceForm clubId={club.id} clubName={club.name} logoUrl={club.logoUrl} accentColor={club.accentColor} />
          </Card>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
