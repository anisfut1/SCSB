"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { PlatformClubDto } from "@/lib/api/platform";

/**
 * Outils de maintenance stockage (retour du club, 2026-09-29 : "mon
 * stockage vercel est quasi à 10gb... faut opti un max" + "focus saison
 * 2026-2027"). Réservé platform_admin (même porte que le reste de
 * `/platform`, voir `layout.tsx`) — ce ne sont pas des actions du
 * quotidien d'un club_admin.
 */
export function MaintenanceActions({ clubs }: { clubs: PlatformClubDto[] }) {
  const router = useRouter();
  const [isPurging, startPurge] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isRetrying, startRetry] = useTransition();
  const [selectedClubId, setSelectedClubId] = useState(clubs[0]?.id ?? "");
  const [purgeMessage, setPurgeMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [retryMessage, setRetryMessage] = useState<{ success: boolean; text: string } | null>(null);

  function handlePurge() {
    if (!window.confirm("Purger tous les documents e-Marque déjà stockés (tous clubs confondus) ? Les statistiques déjà extraites en base ne sont jamais touchées — seuls les fichiers originaux disparaissent de Storage.")) {
      return;
    }

    startPurge(async () => {
      try {
        const result = await browserApi.platform.purgeEmarqueDocuments();
        setPurgeMessage({
          success: true,
          text: `${result.documentsPurged} document(s) purgé(s) sur ${result.documentsExamined} examiné(s)${result.errors > 0 ? ` (${result.errors} en erreur, voir logs)` : ""}.`,
        });
      } catch (error) {
        setPurgeMessage({ success: false, text: error instanceof ApiError ? error.message : "Purge impossible. Réessaie." });
      }
    });
  }

  function handleRetryFailedImports() {
    startRetry(async () => {
      try {
        const result = await browserApi.platform.retryFailedEmarqueImports();
        setRetryMessage({
          success: true,
          text: `${result.matchesRetried} match(s) relancé(s) sur ${result.matchesExamined} en erreur${result.matchesSkippedNoFile > 0 ? ` (${result.matchesSkippedNoFile} ignoré(s), fichier déjà purgé — nécessite un nouveau téléchargement)` : ""}. Le prochain passage du parsing e-Marque les reprendra automatiquement.`,
        });
        router.refresh();
      } catch (error) {
        setRetryMessage({ success: false, text: error instanceof ApiError ? error.message : "Nouvelle tentative impossible. Réessaie." });
      }
    });
  }

  function handleDeleteOldSeasons() {
    const club = clubs.find((c) => c.id === selectedClubId);
    if (!club) return;

    if (
      !window.confirm(
        `Supprimer DÉFINITIVEMENT tous les matchs de "${club.name}" des saisons précédentes (avant le 1er août de la saison en cours) ? Composition, statistiques, officiels, documents et dérogations liés disparaissent avec — IRRÉVERSIBLE. Seule la saison en cours est conservée.`,
      )
    ) {
      return;
    }

    startDelete(async () => {
      try {
        const result = await browserApi.platform.deleteOldSeasons(club.id);
        setDeleteMessage({ success: true, text: `${result.matchesDeleted} match(s) supprimé(s) pour "${club.name}" (avant ${new Date(result.seasonStart).toLocaleDateString("fr-FR")}).` });
        router.refresh();
      } catch (error) {
        setDeleteMessage({ success: false, text: error instanceof ApiError ? error.message : "Suppression impossible. Réessaie." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-black/60 dark:text-white/60">
          Supprime les fichiers e-Marque déjà téléchargés (tous clubs confondus) — les statistiques déjà extraites en base ne sont jamais affectées, seuls les fichiers originaux disparaissent. Idempotent, sûr à relancer.
        </p>
        <button
          type="button"
          disabled={isPurging}
          onClick={handlePurge}
          className="self-start rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {isPurging ? "Purge en cours…" : "Purger les documents e-Marque déjà stockés"}
        </button>
        {purgeMessage ? (
          <p role="status" className={`text-sm ${purgeMessage.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {purgeMessage.text}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-black/10 pt-4 dark:border-white/10">
        <p className="text-sm text-black/60 dark:text-white/60">
          Relance le parsing des matchs e-Marque restés en erreur (tous clubs confondus), en réutilisant le fichier déjà téléchargé — jamais un nouveau login FBI. Sans effet sur les imports déjà réussis avec avertissement (fichier déjà purgé, voir docs/EMARQUE.md).
        </p>
        <button
          type="button"
          disabled={isRetrying}
          onClick={handleRetryFailedImports}
          className="self-start rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {isRetrying ? "Nouvelle tentative en cours…" : "Relancer les imports e-Marque en erreur"}
        </button>
        {retryMessage ? (
          <p role="status" className={`text-sm ${retryMessage.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {retryMessage.text}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-black/10 pt-4 dark:border-white/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-400">Zone dangereuse — suppression irréversible</p>
        <p className="text-sm text-black/60 dark:text-white/60">
          Supprime définitivement tous les matchs d&apos;un club antérieurs à la saison en cours (composition, statistiques, officiels, documents, dérogations liés inclus). Ne garde que la saison en cours.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name} ({club.slug})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isDeleting || !selectedClubId}
            onClick={handleDeleteOldSeasons}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
          >
            {isDeleting ? "Suppression en cours…" : "Supprimer les saisons précédentes de ce club"}
          </button>
        </div>
        {deleteMessage ? (
          <p role="status" className={`text-sm ${deleteMessage.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {deleteMessage.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
