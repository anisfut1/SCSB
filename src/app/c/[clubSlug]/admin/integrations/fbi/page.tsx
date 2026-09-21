import { requireClubAdminContext } from "@/lib/tenancy/club-context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getFbiUsername } from "@/lib/fbi/credentials-store";
import { Card } from "@/components/ui/Card";
import { FbiCredentialsForm } from "@/features/admin/FbiCredentialsForm";
import { TestFbiConnectionButton } from "@/features/admin/TestFbiConnectionButton";

export default async function FbiIntegrationPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const { club } = await requireClubAdminContext(clubSlug);

  const supabase = createAdminSupabaseClient();
  const currentUsername = await getFbiUsername(supabase, club.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Identifiants FBI</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Identifiants FBI propres à {club.name}. Jamais partagés avec un autre club de la plateforme.
        </p>
      </div>

      <Card title="Identifiant / mot de passe">
        <FbiCredentialsForm clubSlug={clubSlug} currentUsername={currentUsername} />
      </Card>

      <Card title="Test de connexion">
        <TestFbiConnectionButton clubSlug={clubSlug} />
      </Card>
    </div>
  );
}
