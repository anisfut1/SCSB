import Link from "next/link";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { triggerFfbbSyncAction } from "@/server/actions/ffbb-sync";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "Jamais";
}

export default async function IntegrationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const [{ data: lastFfbbRun }, { data: fbiStatus }] = await Promise.all([
    supabase.from("sync_runs").select("*").eq("club_id", club.id).eq("provider", "ffbb").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("fbi_integration_status").select("*").eq("club_id", club.id).maybeSingle(),
  ]);

  const triggerFfbbSyncForThisClub = triggerFfbbSyncAction.bind(null, clubSlug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Intégrations</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Sources de données automatiques de {club.name} (code FFBB {club.ffbbClubId}). Aucune opération manuelle sur
          fichier n&apos;est nécessaire au fonctionnement normal — ces boutons sont des outils de diagnostic admin.
        </p>
      </div>

      <Card title="FFBB (calendrier, résultats, classements)">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/60 dark:text-white/60">Statut</dt>
            <dd>Synchronisation automatique active</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernière synchro</dt>
            <dd>
              {formatDateTime(lastFfbbRun?.started_at)}
              {lastFfbbRun?.status ? ` — ${lastFfbbRun.status}` : ""}
            </dd>
          </div>
        </dl>

        <form action={triggerFfbbSyncForThisClub} className="mt-4">
          <button
            type="submit"
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Relancer maintenant
          </button>
        </form>
      </Card>

      <Card title="FBI (licenciés, e-Marque)">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-black/60 dark:text-white/60">Configuré</dt>
            <dd>{fbiStatus?.configured ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernière connexion réussie</dt>
            <dd>{fbiStatus?.last_login_success ? formatDateTime(fbiStatus.last_login_at) : "—"}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernier job</dt>
            <dd>{formatDateTime(fbiStatus?.last_job_at)}</dd>
          </div>
          <div>
            <dt className="text-black/60 dark:text-white/60">Dernière erreur</dt>
            <dd>{fbiStatus?.last_error ?? "—"}</dd>
          </div>
        </dl>

        <Link
          href={`/c/${clubSlug}/admin/integrations/fbi`}
          className="mt-4 inline-block rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Modifier les identifiants / tester la connexion
        </Link>
      </Card>
    </div>
  );
}
