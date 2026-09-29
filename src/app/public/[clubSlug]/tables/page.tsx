import { Suspense } from "react";
import { PublicTablesApp } from "@/features/public-tables/PublicTablesApp";

/**
 * Route publique sans compte (retour du club, 2026-09-29) — volontairement
 * HORS de `/c/[clubSlug]` (protégé par `src/proxy.ts`) : `/public` est
 * listé dans `PUBLIC_PATHS` (voir src/config/site.ts). Toute la logique
 * (résolution du club, choix du nom, tableau) vit côté client dans
 * `PublicTablesApp` — cette page ne fait que fournir `clubSlug`.
 */
export default async function PublicTablesPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      <Suspense fallback={<p className="text-sm text-black/50 dark:text-white/50">Chargement…</p>}>
        <PublicTablesApp clubSlug={clubSlug} />
      </Suspense>
    </div>
  );
}
