import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { api } from "@/lib/api/server";
import { Card } from "@/components/ui/Card";
import { FbiCredentialsForm } from "@/features/admin/FbiCredentialsForm";
import { TestFbiConnectionButton } from "@/features/admin/TestFbiConnectionButton";
import { ProcessFbiJobsButton } from "@/features/admin/ProcessFbiJobsButton";
import { ParseFbiDocumentsButton } from "@/features/admin/ParseFbiDocumentsButton";
import { ReconcileFbiScheduleButton } from "@/features/admin/ReconcileFbiScheduleButton";
import { CheckAllDerogationsButton } from "@/features/admin/CheckAllDerogationsButton";

/**
 * §20/§21 de la demande. Le formulaire et le bouton de test appellent
 * club-manager-api directement (Client Components, voir
 * src/features/admin/{FbiCredentialsForm,TestFbiConnectionButton}.tsx).
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : l'ancien interrupteur
 * "Activer/désactiver la récupération automatique e-Marque"
 * (`fbi_integration_status.auto_import_emarque`) n'a plus d'équivalent
 * fonctionnel ici, volontairement : côté club-manager-api, l'écriture de
 * cette colonne n'est possible qu'avec le client service role (aucune
 * policy RLS `authenticated` en écriture sur `fbi_integration_status`) —
 * l'exposer depuis ce frontend nécessiterait d'y remettre une clé
 * service role, explicitement interdit (§30/§31 de la demande). Le statut
 * reste affiché en LECTURE (`integrations.fbi.autoImportEmarque`, déjà
 * disponible via `GET /v1/clubs/:clubId/integrations`) ; la bascule
 * elle-même nécessite une route `POST` dédiée côté club-manager-api,
 * volontairement pas ajoutée dans cette phase (§56 de la demande : ne pas
 * contourner le backend, documenter le manque).
 */
export default async function FbiIntegrationPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const club = await requireClubAdminContext(clubSlug);

  const integrations = await api.integrations.get(club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">FBI (optionnel)</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Identifiants FBI propres à {club.name}. Jamais partagés avec un autre club de la plateforme. FBI enrichit le
          calendrier FFBB déjà en place — {club.name} fonctionne normalement sans FBI.
        </p>
      </div>

      <Card title="Identifiant / mot de passe">
        <FbiCredentialsForm clubId={club.id} />
      </Card>

      <Card title="Test de connexion">
        <TestFbiConnectionButton clubId={club.id} />
      </Card>

      {integrations.fbi.configured ? (
        <Card title="Documents e-Marque en attente">
          <p className="text-sm text-black/60 dark:text-white/60">
            « Connecté » prouve juste que l&apos;identifiant/mot de passe FBI fonctionnent — ça ne récupère rien tout seul.
            La récupération se fait en deux étapes, chacune en tâche de fond : d&apos;abord le téléchargement des
            documents (feuille de match, résumé), puis leur traitement (OCR/PDF) pour en extraire composition,
            statistiques et officiels. Ces deux boutons les font avancer maintenant plutôt que d&apos;attendre la
            prochaine synchronisation automatique.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">1. Télécharger</p>
              <ProcessFbiJobsButton clubId={club.id} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">2. Traiter les documents téléchargés</p>
              <ParseFbiDocumentsButton clubId={club.id} />
            </div>
          </div>
        </Card>
      ) : null}

      {integrations.fbi.configured ? (
        <Card title="Vérification du calendrier">
          <p className="text-sm text-black/60 dark:text-white/60">
            FFBB reste la seule source du calendrier — FBI est utilisé ici uniquement pour VÉRIFIER ce calendrier et
            détecter d&apos;éventuelles anomalies (écart de date/heure, rencontre visible d&apos;un seul côté), jamais
            pour le remplacer. Les anomalies détectées apparaissent sur la page Anomalies.
          </p>
          <div className="mt-3">
            <ReconcileFbiScheduleButton clubId={club.id} />
          </div>
        </Card>
      ) : null}

      {integrations.fbi.configured ? (
        <Card title="Dérogations">
          <p className="text-sm text-black/60 dark:text-white/60">
            Consultation en lecture seule de toutes les demandes de dérogation FBI du club (jamais de soumission ni de
            modification depuis cet outil). Une seule connexion FBI vérifie toutes les demandes d&apos;un coup plutôt
            que match par match — état et dates apparaissent ensuite sur la page Dérogations. Pour le motif complet et
            la réponse de l&apos;adversaire d&apos;une demande précise, ouvre son match et clique « Vérifier sur FBI ».
          </p>
          <div className="mt-3">
            <CheckAllDerogationsButton clubId={club.id} />
          </div>
        </Card>
      ) : null}

      {integrations.fbi.configured ? (
        <Card title="Récupération automatique e-Marque">
          <p className="text-sm text-black/60 dark:text-white/60">
            {integrations.fbi.autoImportEmarque
              ? "Activée : les feuilles de match, compositions, OTM et statistiques disponibles sont récupérées automatiquement pour chaque match joué."
              : "Désactivée pour l'instant."}
          </p>
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">
            Le changement de ce réglage depuis cette page n&apos;est pas encore disponible (en attente d&apos;une route
            dédiée côté club-manager-api) — contacte l&apos;équipe technique pour le modifier.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
