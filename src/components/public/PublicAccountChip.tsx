"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { Popover, menuItemClass } from "@/components/ui/Popover";
import { UserAvatar } from "@/components/shell/UserMenu";
import { usePublicIdentity } from "@/features/public/PublicIdentityProvider";

/**
 * Identité reconnue dans ce navigateur (lien personnel), à droite de
 * l'en-tête public. Rien tant que personne n'est reconnu : l'identification
 * se fait depuis les onglets qui l'exigent (Tables, Dérogations).
 */
export function PublicAccountChip() {
  const { identity, forget } = usePublicIdentity();
  if (!identity) return null;
  const name = `${identity.licencie.firstName} ${identity.licencie.lastName}`;

  return (
    <Popover
      label="Mon lien personnel"
      align="end"
      trigger={({ toggle, ...aria }) => (
        <button type="button" onClick={toggle} {...aria} aria-label={`Connecté·e en tant que ${name}`} className="-mr-1.5 inline-flex min-h-11 items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 hover:bg-surface-muted aria-expanded:bg-surface-muted">
          <UserAvatar name={name} />
          <span className="hidden max-w-40 truncate text-sm font-medium text-foreground sm:inline">{identity.licencie.firstName}</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="type-meta flex items-center gap-1.5">
              {identity.isClubAdmin ? (
                <>
                  <ShieldCheck aria-hidden className="size-3.5 text-accent-text" />
                  Administrateur du club
                </>
              ) : identity.derogationRequests.canManage ? (
                <>
                  <ShieldCheck aria-hidden className="size-3.5 text-accent-text" />
                  Coordinateur des dérogations
                </>
              ) : identity.derogationRequests.canCreate ? (
                "Coach · reconnu·e via ton lien personnel"
              ) : (
                "Reconnu·e via ton lien personnel"
              )}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              forget();
            }}
            className={menuItemClass}
          >
            <LogOut aria-hidden className="size-4" />
            Oublier ce navigateur
          </button>
        </>
      )}
    </Popover>
  );
}
