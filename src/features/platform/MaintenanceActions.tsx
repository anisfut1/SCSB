"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { PlatformClubDto } from "@/lib/api/platform";
import { AlertOctagon, HardDriveDownload, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormMessage, Select } from "@/components/ui/Field";
import { useConfirm } from "@/components/ui/Dialog";

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
  const [confirm, confirmDialog] = useConfirm();

  function handlePurge() {
    void (async () => {
      const ok = await confirm({
        title: "Purger les documents e-Marque ?",
        description: "Purger tous les documents e-Marque déjà stockés (tous clubs confondus) ? Les statistiques déjà extraites en base ne sont jamais touchées — seuls les fichiers originaux disparaissent de Storage.",
        confirmLabel: "Purger",
        destructive: true,
      });
      if (!ok) return;
      runPurge();
    })();
  }

  function runPurge() {
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

    void (async () => {
      const ok = await confirm({
        title: `Supprimer les saisons précédentes de « ${club.name} » ?`,
        description: `Supprimer DÉFINITIVEMENT tous les matchs de "${club.name}" des saisons précédentes (avant le 1er août de la saison en cours) ? Composition, statistiques, officiels, documents et dérogations liés disparaissent avec — IRRÉVERSIBLE. Seule la saison en cours est conservée.`,
        confirmLabel: "Supprimer définitivement",
        destructive: true,
      });
      if (!ok) return;
      runDelete(club);
    })();
  }

  function runDelete(club: PlatformClubDto) {
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

  const msg = (m: { success: boolean; text: string } | null) => (m ? <FormMessage tone={m.success ? "success" : "danger"}>{m.text}</FormMessage> : null);

  return (
    <div className="flex flex-col divide-y divide-border">
      <div className="flex flex-col gap-3 pb-5">
        <p className="type-card flex items-center gap-2 text-foreground">
          <HardDriveDownload aria-hidden className="size-4 text-accent-text" />
          Purger les fichiers e-Marque
        </p>
        <p className="text-sm text-muted">
          Supprime les fichiers e-Marque déjà téléchargés (tous clubs confondus) — les statistiques déjà extraites en base ne sont jamais affectées, seuls les fichiers originaux disparaissent. Idempotent, sûr à relancer.
        </p>
        <Button variant="secondary" loading={isPurging} onClick={handlePurge} icon={<Trash2 />} className="self-start">
          {isPurging ? "Purge en cours…" : "Purger les documents e-Marque déjà stockés"}
        </Button>
        {msg(purgeMessage)}
      </div>

      <div className="flex flex-col gap-3 py-5">
        <p className="type-card flex items-center gap-2 text-foreground">
          <RotateCcw aria-hidden className="size-4 text-accent-text" />
          Relancer les imports en erreur
        </p>
        <p className="text-sm text-muted">
          Relance le parsing des matchs e-Marque restés en erreur (tous clubs confondus), en réutilisant le fichier déjà téléchargé — jamais un nouveau login FBI. Sans effet sur les imports déjà réussis avec avertissement (fichier déjà purgé, voir docs/EMARQUE.md).
        </p>
        <Button variant="secondary" loading={isRetrying} onClick={handleRetryFailedImports} icon={<RotateCcw />} className="self-start">
          {isRetrying ? "Nouvelle tentative en cours…" : "Relancer les imports e-Marque en erreur"}
        </Button>
        {msg(retryMessage)}
      </div>

      <div className="flex flex-col gap-3 pt-5">
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--danger)_24%,transparent)] bg-danger-soft p-4">
          <p className="type-card flex items-center gap-2 text-danger">
            <AlertOctagon aria-hidden className="size-4" />
            Zone dangereuse — suppression irréversible
          </p>
          <p className="text-sm text-foreground">
            Supprime définitivement tous les matchs d&apos;un club antérieurs à la saison en cours (composition, statistiques, officiels, documents, dérogations liés inclus). Ne garde que la saison en cours.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="sm:w-72">
              <Select aria-label="Club concerné" value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.slug})
                  </option>
                ))}
              </Select>
            </span>
            <Button variant="danger" loading={isDeleting} disabled={!selectedClubId} onClick={handleDeleteOldSeasons} icon={<Trash2 />}>
              {isDeleting ? "Suppression en cours…" : "Supprimer les saisons précédentes"}
            </Button>
          </div>
          {msg(deleteMessage)}
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}
