import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { CreateClubForm } from "@/features/platform/CreateClubForm";

/**
 * Onboarding d'un nouveau club sans toucher au code (§30 du brief SaaS).
 * Réservé au platform_admin (voir /platform/layout.tsx).
 */
export default async function PlatformClubsPage() {
  const supabase = createAdminSupabaseClient();
  const { data: clubs } = await supabase.from("clubs").select("id, name, slug, ffbb_club_id, status, created_at").order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Clubs de la plateforme</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Réservé à l&apos;opérateur de la plateforme (platform_admin). La gestion quotidienne d&apos;un club se fait
          depuis /c/{"{"}slug{"}"}/admin, jamais ici.
        </p>
      </div>

      <Card title="Clubs existants">
        {clubs && clubs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {clubs.map((club) => (
              <li key={club.id} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-0 dark:border-white/10">
                <div>
                  <Link href={`/c/${club.slug}/dashboard`} className="font-medium hover:underline">
                    {club.name}
                  </Link>
                  <span className="ml-2 text-black/60 dark:text-white/60">/c/{club.slug} · {club.ffbb_club_id}</span>
                </div>
                <span className={club.status === "active" ? "text-green-700 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}>
                  {club.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Aucun club pour l&apos;instant.</p>
        )}
      </Card>

      <Card title="Créer un club">
        <CreateClubForm />
      </Card>
    </div>
  );
}
