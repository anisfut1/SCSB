import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { App as CapApp } from "@capacitor/app";
import { Toast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/errors";
import { bootstrapFromToken, loginWithCode, setActiveClub } from "../auth/auth-service";
import { sessionStore } from "../auth/session-store";
import { isNativeApp } from "../native/bm-native";
import { openExternal } from "./external";
import { setPendingDestination, takePendingDestination } from "./pending";
import { createDeduper, resolveLink } from "./universal-link-router";

/**
 * Point d'entrée UNIQUE de toutes les destinations : Universal Links (app
 * fermée, au premier plan, en arrière-plan), URL de lancement, lien collé,
 * notification touchée. Même décision (`resolveLink`) pour tous ; l'API
 * revérifie toujours les droits à l'ouverture de l'écran.
 */
type Handle = (url: string) => Promise<void>;
const Ctx = createContext<{ handle: Handle; busy: boolean }>({ handle: async () => undefined, busy: false });

export function useLinkHandler() {
  return useContext(Ctx);
}

function friendly(error: unknown): string {
  if (error instanceof ApiError && ["CODE_USED", "CODE_EXPIRED"].includes(error.code)) return error.message;
  if (error instanceof ApiError && error.status === 401) return "Ce lien n'est plus valable. Demande un nouveau lien depuis l'écran de connexion.";
  return error instanceof Error ? error.message : "Ouverture du lien impossible.";
}

export function LinkHandlerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const accept = useRef(createDeduper()).current;
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handle = useCallback<Handle>(
    async (url) => {
      if (!accept(url)) return;
      const decision = resolveLink(url);
      const state = await sessionStore.load();
      switch (decision.kind) {
        case "reject":
          return;
        case "home":
          navigate("/");
          return;
        case "external":
          openExternal(decision.url);
          return;
        case "navigate":
          if (state.clubs[decision.clubSlug]) {
            await setActiveClub(decision.clubSlug);
            navigate(decision.path);
          } else {
            // Pas encore connecté à ce club : on garde la destination pour après la connexion.
            setPendingDestination({ clubSlug: decision.clubSlug, path: decision.path });
            navigate(`/app/connexion/${decision.clubSlug}`);
          }
          return;
        case "bootstrap":
        case "login-code": {
          setBusy(true);
          try {
            const redirect = decision.kind === "bootstrap" ? (await bootstrapFromToken(decision.clubSlug, decision.token), decision.path) : await loginWithCode(decision.clubSlug, decision.code);
            navigate(takePendingDestination(decision.clubSlug) ?? redirect ?? `/public/${decision.clubSlug}/accueil`, { replace: true });
          } catch (error) {
            setToast(friendly(error));
            navigate(`/app/connexion/${decision.clubSlug}`);
          } finally {
            setBusy(false);
          }
          return;
        }
      }
    },
    [accept, navigate],
  );

  useEffect(() => {
    if (!isNativeApp()) return;
    // App ouverte par un lien alors qu'elle était fermée (démarrage à froid)…
    void CapApp.getLaunchUrl().then((launch) => {
      if (launch?.url) void handle(launch.url);
    });
    // … ou au premier plan / en arrière-plan.
    const sub = CapApp.addListener("appUrlOpen", (event) => void handle(event.url));
    return () => {
      void sub.then((s) => s.remove());
    };
  }, [handle]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo(() => ({ handle, busy }), [handle, busy]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {busy ? (
        <div role="status" className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 text-[15px] font-medium text-foreground backdrop-blur-sm">
          Connexion…
        </div>
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </Ctx.Provider>
  );
}
