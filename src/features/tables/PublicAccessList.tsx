"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { PublicAccessEntryDto } from "@/lib/api/tables";

/**
 * Gestion admin des accès publics sans compte (retour du club, 2026-09-29 :
 * "sauf si admin remet à reset son profil"). `club_admin` uniquement (voir
 * la page appelante, `requireClubAdminContext`). La réinitialisation ne
 * touche JAMAIS les affectations déjà existantes du licencié — seul son
 * lien d'accès change (voir club-manager-api/docs/PUBLIC_TABLE_ACCESS.md).
 */
export function PublicAccessList({ clubId, entries }: { clubId: string; entries: PublicAccessEntryDto[] }) {
  const router = useRouter();
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reset(licencieId: string, label: string) {
    if (!window.confirm(`Réinitialiser l'accès public de ${label} ? Son lien actuel cessera de fonctionner — son nom redeviendra choisissable sur le lien commun.`)) return;

    setResettingId(licencieId);
    setError(null);
    try {
      await browserApi.tables.resetPublicAccess(clubId, licencieId);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réinitialisation impossible.");
    } finally {
      setResettingId(null);
    }
  }

  if (entries.length === 0) {
    return (
      <Card title="Aucun licencié actif">
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">Rien à afficher — aucun licencié actif dans ce club.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.licencie.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
            <div className="flex flex-col">
              <span className="font-medium text-black/90 dark:text-white/90">
                {entry.licencie.firstName} {entry.licencie.lastName}
              </span>
              <span className="text-xs text-black/50 dark:text-white/50">
                {entry.claimed ? (entry.email ? `Lien revendiqué — ${entry.email}` : "Lien revendiqué") : "Lien non revendiqué"}
              </span>
            </div>
            {entry.claimed ? (
              <button
                type="button"
                disabled={resettingId === entry.licencie.id}
                onClick={() => reset(entry.licencie.id, `${entry.licencie.firstName} ${entry.licencie.lastName}`)}
                className="shrink-0 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                {resettingId === entry.licencie.id ? "…" : "Réinitialiser"}
              </button>
            ) : (
              <span className="shrink-0 text-xs text-black/30 dark:text-white/30">—</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
