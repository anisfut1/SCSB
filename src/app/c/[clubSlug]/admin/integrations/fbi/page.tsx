import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getFbiUsername } from "@/lib/fbi/credentials-store";
import { setAutoImportEmarqueAction } from "@/server/actions/fbi-integration";
import { Card } from "@/components/ui/Card";
import { FbiCredentialsForm } from "@/features/admin/FbiCredentialsForm";
import { TestFbiConnectionButton } from "@/features/admin/TestFbiConnectionButton";

export default async function FbiIntegrationPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const [currentUsername, { data: fbiStatus }] = await Promise.all([
    getFbiUsername(supabase, club.id),
    supabase.from("fbi_integration_status").select("configured, last_login_success, auto_import_emarque").eq("club_id", club.id).maybeSingle(),
  ]);

  const setAutoImport = setAutoImportEmarqueAction.bind(null, clubSlug);

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
        <FbiCredentialsForm clubSlug={clubSlug} currentUsername={currentUsername} />
      </Card>

      <Card title="Test de connexion">
        <TestFbiConnectionButton clubSlug={clubSlug} />
      </Card>

      {fbiStatus?.configured && fbiStatus.last_login_success ? (
        <Card title="Récupération automatique e-Marque">
          <p className="text-sm text-black/60 dark:text-white/60">
            Une fois activée, les feuilles de match, compositions, OTM et statistiques disponibles sont récupérées
            automatiquement pour chaque match joué — aucune action manuelle nécessaire.
          </p>
          <form
            action={async () => {
              "use server";
              await setAutoImport(!fbiStatus.auto_import_emarque);
            }}
            className="mt-4"
          >
            <button
              type="submit"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              {fbiStatus.auto_import_emarque ? "Désactiver l'e-Marque automatique" : "Activer la récupération automatique e-Marque"}
            </button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
