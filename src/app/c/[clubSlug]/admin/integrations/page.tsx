import { AlertTriangle, ArrowRight, CalendarRange, CheckCircle2, CircleOff, FileText, KeyRound, PlugZap } from "lucide-react";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { DataList } from "@/components/ui/DataList";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { IntegrationCard } from "@/features/admin/IntegrationCard";
import { TriggerFfbbSyncButton } from "@/features/admin/TriggerFfbbSyncButton";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "Jamais";
}

/**
 * §19 de la demande : `GET /v1/clubs/:clubId/integrations` +
 * `GET /v1/clubs/:clubId/capabilities`, plus aucun accès Supabase direct.
 * Le statut e-Marque affiché est celui exposé par l'API
 * (`fbi.autoImportEmarque`, `capabilities.emarque`) — jamais déduit ici.
 */
export default async function IntegrationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const [integrations, capabilities] = await Promise.all([api.integrations.get(club.id), api.clubs.capabilities(club.id)]);
  const fbiHref = `/c/${clubSlug}/admin/integrations/fbi`;
  const fbi = integrations.fbi;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Administration"
        title="Intégrations"
        description={`Sources de données automatiques de ${club.name}. Aucune opération manuelle sur fichier n'est nécessaire au fonctionnement normal — les boutons ci-dessous sont des outils de diagnostic admin.`}
      />

      {fbi.activeJob ? (
        <Notice tone="info" title="Une opération FBI est en cours" action={<ButtonLink href={fbiHref} variant="secondary" size="sm">Voir</ButtonLink>}>
          Les autres actions FBI attendent qu&apos;elle se termine.
        </Notice>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <IntegrationCard
          icon={<CalendarRange />}
          name="FFBB"
          role="Calendrier, résultats, classements"
          status={integrations.ffbb.enabled ? { label: "Connecté", tone: "success", icon: <CheckCircle2 /> } : { label: "Désactivé", tone: "neutral", icon: <CircleOff /> }}
          footer={<TriggerFfbbSyncButton clubId={club.id} />}
        >
          <DataList
            items={[
              { label: "Dernière synchro", value: formatDateTime(integrations.ffbb.lastSyncAt) },
              { label: "Résultat", value: integrations.ffbb.lastSyncStatus ?? "—" },
            ]}
          />
        </IntegrationCard>

        <IntegrationCard
          icon={<KeyRound />}
          name="FBI"
          role="e-Marque, feuilles de match, statistiques"
          highlight={Boolean(fbi.activeJob)}
          status={
            !capabilities.fbi
              ? { label: "Non connecté", tone: "neutral", icon: <PlugZap /> }
              : fbi.connected
                ? { label: "Connecté", tone: "success", icon: <CheckCircle2 /> }
                : { label: "En erreur", tone: "danger", icon: <AlertTriangle /> }
          }
          footer={
            <ButtonLink href={fbiHref} variant={capabilities.fbi ? "secondary" : "primary"} iconRight={<ArrowRight />} className="self-start">
              {capabilities.fbi ? "Modifier les identifiants / tester la connexion" : "Connecter FBI"}
            </ButtonLink>
          }
        >
          {!capabilities.fbi ? (
            <div className="flex flex-col gap-2 text-sm text-muted">
              <p>
                <span className="font-medium text-foreground">Optionnel</span> — {club.name} fonctionne normalement sans FBI (calendrier, matchs, résultats).
              </p>
              <p>FBI permet d&apos;ajouter automatiquement les feuilles de match, compositions, OTM et statistiques lorsqu&apos;elles sont disponibles.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <DataList
                items={[
                  { label: "Identifiant", value: fbi.username ?? "—" },
                  { label: "Dernier accès", value: formatDateTime(fbi.lastLoginAt) },
                ]}
              />
              {!fbi.connected ? <p className="type-meta">Le calendrier reste disponible.</p> : null}
              {fbi.lastError ? (
                <Notice tone="danger" title="Dernière erreur">
                  {fbi.lastError}
                </Notice>
              ) : null}
            </div>
          )}
        </IntegrationCard>

        <IntegrationCard
          icon={<FileText />}
          name="e-Marque"
          role="Composition, officiels, statistiques par joueur"
          status={
            !capabilities.fbi
              ? { label: "Nécessite FBI", tone: "neutral", icon: <CircleOff /> }
              : fbi.autoImportEmarque
                ? { label: "Automatique", tone: "success", icon: <CheckCircle2 /> }
                : { label: "Désactivé", tone: "neutral", icon: <CircleOff /> }
          }
          footer={
            capabilities.fbi ? (
              <ButtonLink href={fbiHref} variant="ghost" iconRight={<ArrowRight />} className="self-start">
                Documents et traitement
              </ButtonLink>
            ) : undefined
          }
        >
          <p className="text-sm text-muted">
            {!capabilities.fbi
              ? "Les feuilles e-Marque sont récupérées via FBI : connectez FBI pour les activer."
              : fbi.autoImportEmarque
                ? "Les feuilles de match, compositions, OTM et statistiques disponibles sont récupérées automatiquement pour chaque match joué."
                : "Récupération automatique désactivée pour l'instant."}
          </p>
        </IntegrationCard>
      </div>
    </PageContainer>
  );
}
