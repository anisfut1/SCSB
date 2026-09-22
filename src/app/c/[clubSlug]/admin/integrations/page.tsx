import Link from "next/link";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { TriggerFfbbSyncButton } from "@/features/admin/TriggerFfbbSyncButton";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "Jamais";
}

/**
 * §19 de la demande : `GET /v1/clubs/:clubId/integrations` +
 * `GET /v1/clubs/:clubId/capabilities`, plus aucun accès Supabase direct.
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : le code FFBB du club
 * (`club.ffbbClubId`, affiché ici auparavant) n'est pas exposé par
 * `ClubDto` (GET /v1/clubs, GET /v1/clubs/:clubId) — seulement par
 * `PlatformClubDto`, réservé au platform_admin. De même, le libellé
 * "Dernier import e-Marque" (rencontre + date) n'a pas d'équivalent API
 * (pas de liste `emarque_imports` exposée) : il n'est plus affiché ici.
 */
export default async function IntegrationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const [integrations, capabilities] = await Promise.all([api.integrations.get(club.id), api.clubs.capabilities(club.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Intégrations</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Sources de données automatiques de {club.name}. Aucune opération manuelle sur fichier n&apos;est nécessaire
          au fonctionnement normal — ces boutons sont des outils de diagnostic admin.
        </p>
      </div>

      <Card title="FFBB (calendrier, résultats, classements)">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/60 dark:text-white/60">Statut</dt>
            <dd>{integrations.ffbb.enabled ? "Connecté ✅" : "Désactivé"}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernière synchro</dt>
            <dd>
              {formatDateTime(integrations.ffbb.lastSyncAt)}
              {integrations.ffbb.lastSyncStatus ? ` — ${integrations.ffbb.lastSyncStatus}` : ""}
            </dd>
          </div>
        </dl>

        <TriggerFfbbSyncButton clubId={club.id} />
      </Card>

      <Card title="FBI (e-Marque, feuilles de match, statistiques)">
        {!capabilities.fbi ? (
          <>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-black/60 dark:text-white/60">Statut</dt>
                <dd>Non connecté</dd>
              </div>
              <div>
                <dt className="text-black/60 dark:text-white/60">Optionnel</dt>
                <dd>{club.name} fonctionne normalement sans FBI (calendrier, matchs, résultats).</dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              FBI permet d&apos;ajouter automatiquement les feuilles de match, compositions, OTM et statistiques
              lorsqu&apos;elles sont disponibles.
            </p>
          </>
        ) : (
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-black/60 dark:text-white/60">Statut</dt>
              <dd>{integrations.fbi.connected ? "Connecté ✅" : "En erreur ⚠️ (le calendrier reste disponible)"}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Dernier accès</dt>
              <dd>{formatDateTime(integrations.fbi.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">e-Marque</dt>
              <dd>{integrations.fbi.autoImportEmarque ? "Automatique ✅" : "Désactivé"}</dd>
            </div>
            {integrations.fbi.lastError ? (
              <div className="sm:col-span-2">
                <dt className="text-black/60 dark:text-white/60">Dernière erreur</dt>
                <dd className="text-red-600 dark:text-red-400">{integrations.fbi.lastError}</dd>
              </div>
            ) : null}
          </dl>
        )}

        <Link
          href={`/c/${clubSlug}/admin/integrations/fbi`}
          className="mt-4 inline-block rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {capabilities.fbi ? "Modifier les identifiants / tester la connexion" : "Connecter FBI"}
        </Link>
      </Card>
    </div>
  );
}
