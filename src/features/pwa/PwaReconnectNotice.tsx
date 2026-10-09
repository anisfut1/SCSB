"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserRoundCheck } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { readInstallEnvironment } from "@/lib/pwa/platform";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";

/**
 * Reconnexion simplifiée dans l'application installée. Sur iOS, les cookies ne
 * sont copiés de Safari vers la PWA qu'à l'AJOUT à l'écran d'accueil (≥ 17.2) et
 * pas du tout depuis le navigateur intégré de WhatsApp : si la PWA ne reconnaît
 * personne, on l'explique et on propose de se reconnaître (nom → e-mail →
 * nouveau lien) sans jamais promettre un partage permanent des sessions.
 */
export function PwaReconnectNotice() {
  const { identity, clubSlug } = usePublicIdentity();
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStandalone(readInstallEnvironment().standalone);
  }, []);

  if (!standalone || identity !== null) return null;
  return (
    <div className="mx-auto w-full max-w-[var(--content-wide)] px-4 pt-3 sm:px-6 lg:px-10">
      <Notice
        tone="info"
        icon={<UserRoundCheck />}
        title="Reconnaissez-vous dans l'application"
        action={
          <Link href={`/public/${clubSlug}/connexion`} className={buttonClasses({ variant: "primary", size: "sm" })}>
            Me reconnaître
          </Link>
        }
      >
        L&apos;application installée garde sa propre connexion. Saisissez votre nom : un nouveau lien vous est envoyé par e-mail, à ouvrir ici une seule fois.
      </Notice>
    </div>
  );
}
