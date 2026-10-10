import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useParams } from "react-router";
import { App as CapApp } from "@capacitor/app";
import { UserRound } from "lucide-react";
import { ClubLogo } from "@/components/ui/Logo";
import { PublicBottomNav } from "@/components/public/PublicNav";
import { clubAccentStyle } from "@/lib/ui/accent";
import { MobileIdentityProvider } from "../auth/MobileIdentityProvider";
import { useSessions } from "../auth/SessionContext";
import { setActiveClub } from "../auth/auth-service";
import { setPendingDestination } from "../links/pending";
import { isNativeApp } from "../native/bm-native";
import { REFRESH_EVENT } from "../shims/next-navigation";
import { loadClub, useLoad } from "../screens/use-load";
import { NetworkBanner } from "./NetworkState";
import { Splash } from "./Splash";

/**
 * Cadre natif de l'espace club : zones sûres (encoche, barre d'accueil),
 * en-tête du club, barre d'onglets du site (même navigation), état réseau.
 * Sans session pour ce club : connexion, puis retour EXACT à l'écran demandé.
 */
export function MobileShell() {
  const { clubSlug = "" } = useParams<{ clubSlug: string }>();
  const location = useLocation();
  const sessions = useSessions();
  const [refreshKey, setRefreshKey] = useState(0);
  const club = useLoad(() => loadClub(clubSlug), [clubSlug]);

  useEffect(() => {
    const refresh = () => setRefreshKey((k) => k + 1);
    window.addEventListener(REFRESH_EVENT, refresh);
    // Retour de l'app au premier plan : données fraîches (convocation confirmée ailleurs, match modifié…).
    const sub = isNativeApp() ? CapApp.addListener("resume", () => window.dispatchEvent(new Event(REFRESH_EVENT))) : null;
    return () => {
      window.removeEventListener(REFRESH_EVENT, refresh);
      void sub?.then((s) => s.remove());
    };
  }, []);

  const session = sessions?.clubs[clubSlug];
  useEffect(() => {
    if (session && sessions?.active !== clubSlug) void setActiveClub(clubSlug);
  }, [session, sessions?.active, clubSlug]);

  if (!sessions) return <Splash />;
  if (!session) {
    setPendingDestination({ clubSlug, path: `${location.pathname}${location.search}${location.hash}` });
    return <Navigate to={`/app/connexion/${clubSlug}`} replace />;
  }

  return (
    <MobileIdentityProvider session={session}>
      <div style={clubAccentStyle(club.data?.accentColor ?? null)} className="accent-scope flex min-h-dvh flex-col bg-background">
        <header className="surface-glass sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)]">
          <div className="flex h-14 items-center gap-3 px-4">
            <ClubLogo name={session.clubName} src={club.data?.logoUrl ?? null} size="sm" />
            <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{session.clubName}</p>
            <Link to={`/public/${clubSlug}/compte`} aria-label="Mon compte" className="inline-flex size-11 items-center justify-center rounded-full text-muted active:bg-surface-muted [&_svg]:size-5">
              <UserRound aria-hidden />
            </Link>
          </div>
        </header>
        <NetworkBanner />
        <main id="main" className="pb-safe-nav flex flex-1 flex-col">
          <Outlet key={refreshKey} />
        </main>
        <PublicBottomNav clubSlug={clubSlug} />
      </div>
    </MobileIdentityProvider>
  );
}
