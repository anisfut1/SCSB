import Link from "next/link";
import { Building2, Check, Minus, Plus, Wrench } from "lucide-react";
import { getPlatformClubs } from "@/lib/auth/platform";
import { Card, CardDivider, CardHeader } from "@/components/ui/Card";
import { PageContainer, PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ClubLogo } from "@/components/ui/Logo";
import { EmptyState } from "@/components/ui/States";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/Table";
import { CreateClubForm } from "@/features/platform/CreateClubForm";
import { MaintenanceActions } from "@/features/platform/MaintenanceActions";
import type { PlatformClubDto } from "@/lib/api/platform";

/** Capacité active/inactive : icône + libellé (lecteurs d'écran), jamais la couleur seule. */
function Capability({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${ok ? "text-foreground" : "text-subtle"}`}>
      <span aria-hidden className={`inline-flex size-5 items-center justify-center rounded-full ${ok ? "bg-success-soft text-success" : "bg-surface-muted text-subtle"}`}>
        {ok ? <Check className="size-3" /> : <Minus className="size-3" />}
      </span>
      {label}
      <span className="sr-only">{ok ? " actif" : " inactif"}</span>
    </span>
  );
}

function ClubStatus({ club }: { club: PlatformClubDto }) {
  return club.status === "active" ? (
    <StatusBadge tone="success" size="sm">
      Actif
    </StatusBadge>
  ) : (
    <StatusBadge tone="warning" size="sm">
      Suspendu
    </StatusBadge>
  );
}

/**
 * Onboarding d'un nouveau club sans toucher au code (§30 du brief SaaS), et
 * indicateurs simples FFBB/FBI/e-Marque par club (§45 du brief FBI) — §24
 * de la demande : `GET /v1/platform/clubs`, capabilities déjà calculées
 * côté backend (`PlatformClubDto`), plus aucun accès Supabase direct ni
 * service_role. Réservé au platform_admin (voir /platform/layout.tsx).
 */
export default async function PlatformClubsPage() {
  const clubs = await getPlatformClubs();
  const active = clubs.filter((c) => c.status === "active").length;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Plateforme"
        title="Clubs"
        description="Réservé à l'opérateur de la plateforme. Clique sur un club pour voir et nommer ses administrateurs ; la gestion quotidienne se fait ensuite dans l'espace du club."
      />

      <section aria-label="Indicateurs plateforme" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Clubs" value={clubs.length} icon={<Building2 />} hint={`${active} actif${active > 1 ? "s" : ""}`} />
        <StatCard label="FFBB" value={clubs.filter((c) => c.ffbb).length} tone="neutral" hint="clubs synchronisés" />
        <StatCard label="FBI" value={clubs.filter((c) => c.fbi).length} tone="neutral" hint="clubs connectés" />
        <StatCard label="e-Marque" value={clubs.filter((c) => c.emarque).length} tone="neutral" hint="imports actifs" />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader title="Clubs existants" />
        {clubs.length === 0 ? (
          <EmptyState icon={<Building2 />} title="Aucun club pour l'instant" description="Créez le premier club ci-dessous." />
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block">
              <Table caption="Clubs de la plateforme">
                <THead>
                  <tr>
                    <Th>Club</Th>
                    <Th>Code FFBB</Th>
                    <Th>Statut</Th>
                    <Th>Intégrations</Th>
                  </tr>
                </THead>
                <TBody>
                  {clubs.map((club) => (
                    <Tr key={club.id}>
                      <Td>
                        <Link href={`/platform/clubs/${club.id}`} className="group flex items-center gap-3">
                          <ClubLogo name={club.name} size="sm" />
                          <span className="flex flex-col">
                            <span className="font-medium text-foreground group-hover:text-accent-text group-hover:underline group-hover:underline-offset-4">{club.name}</span>
                            <span className="type-meta text-xs">Gérer les administrateurs ›</span>
                          </span>
                        </Link>
                      </Td>
                      <Td numeric>{club.ffbbClubId}</Td>
                      <Td>
                        <ClubStatus club={club} />
                      </Td>
                      <Td>
                        <span className="flex flex-wrap gap-4">
                          <Capability ok={club.ffbb} label="FFBB" />
                          <Capability ok={club.fbi} label="FBI" />
                          <Capability ok={club.emarque} label="e-Marque" />
                        </span>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

            {/* Mobile : cartes */}
            <ul className="flex flex-col gap-3 md:hidden">
              {clubs.map((club) => (
                <li key={club.id}>
                  <Link href={`/platform/clubs/${club.id}`} data-interactive="true" className="surface-card flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <ClubLogo name={club.name} size="md" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-foreground">{club.name}</span>
                        <span className="type-meta truncate font-mono text-xs">
                          /c/{club.slug} · {club.ffbbClubId}
                        </span>
                      </div>
                      <ClubStatus club={club} />
                    </div>
                    <div className="flex flex-wrap gap-4 border-t border-border pt-3">
                      <Capability ok={club.ffbb} label="FFBB" />
                      <Capability ok={club.fbi} label="FBI" />
                      <Capability ok={club.emarque} label="e-Marque" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <Card>
          <CardHeader icon={<Plus />} title="Créer un club" description="Onboarding d'un nouveau club, avec invitation optionnelle de son premier administrateur." />
          <CardDivider />
          <CreateClubForm />
        </Card>
        <Card>
          <CardHeader icon={<Wrench />} title="Maintenance stockage" description="Opérations globales, tous clubs confondus." />
          <CardDivider />
          <MaintenanceActions clubs={clubs} />
        </Card>
      </div>
    </PageContainer>
  );
}
