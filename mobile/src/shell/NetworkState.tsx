import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { REFRESH_EVENT } from "../shims/next-navigation";

/** Jamais d'écran blanc : sans réseau, un état clair et « Réessayer ». */
export function NetworkError() {
  return (
    <EmptyState
      icon={<WifiOff />}
      title="Connexion indisponible"
      description="Vérifie ta connexion internet puis réessaie. Tes réponses déjà envoyées sont bien enregistrées."
      action={
        <Button icon={<RefreshCw />} onClick={() => window.dispatchEvent(new Event(REFRESH_EVENT))}>
          Réessayer
        </Button>
      }
    />
  );
}

/** Bandeau discret en haut de l'écran quand l'iPhone est hors ligne ; rechargement automatique au retour du réseau. */
export function NetworkBanner() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const up = () => {
      setOnline(true);
      window.dispatchEvent(new Event(REFRESH_EVENT));
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-[13px] font-medium text-foreground [&_svg]:size-4">
      <WifiOff aria-hidden /> Connexion indisponible — les informations peuvent ne pas être à jour.
    </div>
  );
}
