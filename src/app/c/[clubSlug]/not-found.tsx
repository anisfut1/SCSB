import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";

/** Ressource introuvable dans l'espace club (match, licencié…) : rendu dans le shell. */
export default function ClubNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[var(--content-default)] flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <EmptyState
        icon={<SearchX />}
        title="Introuvable"
        description="Cet élément n'existe pas, n'existe plus, ou n'appartient pas à ce club."
        action={
          <ButtonLink href="/" variant="secondary">
            Retour à l&apos;accueil
          </ButtonLink>
        }
      />
    </div>
  );
}
