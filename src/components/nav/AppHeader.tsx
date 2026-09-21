import { SITE_NAME } from "@/config/site";
import { signOutAction } from "@/server/actions/auth";

interface AppHeaderProps {
  displayName: string;
}

/**
 * En-tête minimale de l'espace protégé : nom du club + déconnexion.
 * Mobile-first (une seule ligne, pas de menu à gérer) — un vrai menu de
 * navigation (sidebar desktop / barre mobile) sera ajouté quand plusieurs
 * modules existeront réellement (Phase 1+).
 */
export function AppHeader({ displayName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{SITE_NAME}</p>
        <p className="truncate text-xs text-black/60 dark:text-white/60">Bonjour {displayName}</p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="shrink-0 rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Déconnexion
        </button>
      </form>
    </header>
  );
}
