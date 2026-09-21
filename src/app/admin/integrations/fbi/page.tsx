import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getClubId } from "@/lib/domain/club/club-repository";
import { getFbiUsername } from "@/lib/fbi/credentials-store";
import { Card } from "@/components/ui/Card";
import { FbiCredentialsForm } from "@/features/admin/FbiCredentialsForm";
import { TestFbiConnectionButton } from "@/features/admin/TestFbiConnectionButton";

export default async function FbiIntegrationPage() {
  const supabase = createAdminSupabaseClient();
  const clubId = await getClubId(supabase);

  const [username, { data: status }] = await Promise.all([
    getFbiUsername(supabase, clubId),
    supabase.from("fbi_integration_status").select("*").eq("club_id", clubId).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Intégration FBI</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Identifiants du compte club FBI, utilisés uniquement côté serveur pour récupérer automatiquement les
          documents e-Marque des matchs joués. Le mot de passe n&apos;est jamais renvoyé au navigateur.
        </p>
      </div>

      <Card title="Identifiants">
        <FbiCredentialsForm currentUsername={username} />
      </Card>

      <Card title="État de la connexion">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/60 dark:text-white/60">Configuré</dt>
            <dd>{status?.configured ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernier test</dt>
            <dd>
              {status?.last_test_at ? new Date(status.last_test_at).toLocaleString("fr-FR") : "Jamais testé"}
              {status?.last_test_success === true ? " — réussi" : ""}
              {status?.last_test_success === false ? " — échoué" : ""}
            </dd>
          </div>
          {status?.last_test_message ? (
            <div className="sm:col-span-2">
              <dt className="text-black/60 dark:text-white/60">Message</dt>
              <dd>{status.last_test_message}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernier job</dt>
            <dd>{status?.last_job_at ? new Date(status.last_job_at).toLocaleString("fr-FR") : "Aucun pour l'instant"}</dd>
          </div>
        </dl>

        <div className="mt-4">
          <TestFbiConnectionButton />
        </div>
      </Card>
    </div>
  );
}
