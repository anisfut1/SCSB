import { Building2, Palette } from "lucide-react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { Card } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ClubLogo } from "@/components/ui/Logo";
import { DataList } from "@/components/ui/DataList";
import { deriveClubAccent, FALLBACK_ACCENT } from "@/lib/ui/accent";
import { ClubSettingsForm } from "@/features/admin/ClubSettingsForm";
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
 * L'apparence (logo, couleur d'accent) est affichée en lecture seule : sa
 * modification n'est pas proposée ici.
 */
export default async function ClubSettingsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);
  const accent = deriveClubAccent(club.accentColor);

  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Administration" title="Réglages du club" description="Identité et apparence de l'espace club." />

      <div className="flex flex-col gap-8">
        <SettingsSection icon={<Building2 />} title="Identité du club" description="Nom affiché partout dans l'application et fuseau horaire de référence.">
          <Card>
            <ClubSettingsForm clubSlug={clubSlug} name={club.name} shortName={club.shortName} timezone={club.timezone} />
          </Card>
        </SettingsSection>

        <SettingsSection icon={<Palette />} title="Apparence" description="Logo et couleur d'accent utilisés par l'interface. Lecture seule depuis cette page.">
          <Card>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ClubLogo name={club.name} src={club.logoUrl} size="xl" />
              <DataList
                className="flex-1"
                items={[
                  { label: "Logo", value: club.logoUrl ? "Défini" : "Non défini — monogramme utilisé" },
                  {
                    label: "Couleur d'accent",
                    value: (
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="size-4 rounded-[5px] border border-border shadow-1" style={{ background: accent.accent }} />
                        <span className="type-numeric uppercase">{club.accentColor ?? `${FALLBACK_ACCENT} (par défaut)`}</span>
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </Card>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
