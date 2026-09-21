import { PLATFORM_NAME } from "@/config/site";
import { signOutAction } from "@/server/actions/auth";
import { ClubSwitcher } from "./ClubSwitcher";

interface AppHeaderProps {
  displayName: string;
  /** Club courant (pages sous /c/{slug}/...). Absent sur les pages hors contexte club (chooser, /platform). */
  club?: { name: string; slug: string };
  /** Autres clubs de l'utilisateur, pour le switcher (§14 du brief SaaS). N'affiche rien si <= 1 club au total. */
  otherClubs?: { slug: string; name: string }[];
}

/**
 * En-tête minimale de l'espace protégé. Le nom affiché est celui du club
 * COURANT (jamais une marque en dur, voir docs/MULTI_TENANCY.md §17) — le
 * nom de la plateforme n'apparaît que hors contexte club.
 */
export function AppHeader({ displayName, club, otherClubs = [] }: AppHeaderProps) {
  const allClubs = club ? [{ slug: club.slug, name: club.name }, ...otherClubs] : otherClubs;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-black/10 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-black/70">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{club?.name ?? PLATFORM_NAME}</p>
        <p className="truncate text-xs text-black/60 dark:text-white/60">Bonjour {displayName}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {club ? <ClubSwitcher currentSlug={club.slug} clubs={allClubs} /> : null}
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
