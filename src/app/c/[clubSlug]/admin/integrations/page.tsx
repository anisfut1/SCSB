import Link from "next/link";
import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getClubCapabilities } from "@/lib/tenancy/club-capabilities";
import { Card } from "@/components/ui/Card";
import { triggerFfbbSyncAction } from "@/server/actions/ffbb-sync";

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "Jamais";
}

export default async function IntegrationsPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const [{ data: lastFfbbRun }, { data: fbiStatus }, capabilities] = await Promise.all([
    supabase.from("sync_runs").select("*").eq("club_id", club.id).eq("provider", "ffbb").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("fbi_integration_status").select("*").eq("club_id", club.id).maybeSingle(),
    getClubCapabilities(supabase, club.id),
  ]);

  let lastImportLabel: string | null = null;
  if (capabilities.emarque) {
    const { data: lastImport } = await supabase
      .from("emarque_imports")
      .select("imported_at, match_id")
      .eq("club_id", club.id)
      .eq("status", "imported")
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastImport?.match_id) {
      const { data: match } = await supabase.from("matches").select("numero, opponent_name").eq("id", lastImport.match_id).maybeSingle();
      const label = [match?.numero, match?.opponent_name].filter(Boolean).join(" — ");
      lastImportLabel = `${label || "Rencontre"} · ${formatDateTime(lastImport.imported_at)}`;
    }
  }

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
            <dd>Connecté ✅</dd>
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
              <dd>{fbiStatus?.last_login_success ? "Connecté ✅" : "En erreur ⚠️ (le calendrier reste disponible)"}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Dernier accès</dt>
              <dd>{formatDateTime(fbiStatus?.last_login_at)}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">e-Marque</dt>
              <dd>{fbiStatus?.auto_import_emarque ? "Automatique ✅" : "Désactivé"}</dd>
            </div>
            <div>
              <dt className="text-black/60 dark:text-white/60">Dernier import</dt>
              <dd>{lastImportLabel ?? "—"}</dd>
            </div>
            {fbiStatus?.last_error ? (
              <div className="sm:col-span-2">
                <dt className="text-black/60 dark:text-white/60">Dernière erreur</dt>
                <dd className="text-red-600 dark:text-red-400">{fbiStatus.last_error}</dd>
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
