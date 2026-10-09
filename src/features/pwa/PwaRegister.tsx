"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { listenForInstallPrompt } from "./install-prompt";

/**
 * Enregistre le Service Worker (production uniquement : en développement un
 * worker masquerait les rechargements à chaud), propose la mise à jour quand
 * une nouvelle version est prête, et signale l'absence de réseau.
 */
export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => listenForInstallPrompt(), []);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        const watch = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            // Un worker déjà actif + un nouveau « installed » = mise à jour prête.
            if (worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker);
          });
        };
        if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
        registration.addEventListener("updatefound", () => watch(registration.installing));
        // Une PWA reste ouverte des jours : on revérifie à chaque retour au premier plan.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") void registration.update().catch(() => {});
        });
      })
      .catch(() => {
        // Service Worker indisponible (navigation privée, politique d'entreprise…) : l'appli fonctionne sans.
      });

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!waiting && !offline) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
      {offline ? (
        <div role="status" className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2 text-sm text-foreground shadow-3">
          <WifiOff aria-hidden className="size-4 text-warning" />
          Hors ligne — les données affichées peuvent être dépassées
        </div>
      ) : null}
      {waiting ? (
        <div role="status" className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-surface-raised py-1.5 pl-4 pr-1.5 text-sm text-foreground shadow-3">
          Nouvelle version disponible
          <Button size="sm" variant="primary" icon={<RefreshCw aria-hidden />} onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>
            Mettre à jour
          </Button>
        </div>
      ) : null}
    </div>
  );
}
