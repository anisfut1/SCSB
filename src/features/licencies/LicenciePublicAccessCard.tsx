"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDivider, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Checkbox, FormMessage } from "@/components/ui/Field";
import { useConfirm } from "@/components/ui/Dialog";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { PublicAccessEntryDto } from "@/lib/api/tables";

function formatDate(value: string | null): string | null {
  return value ? new Date(value).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" }) : null;
}

/**
 * Lien personnel sans compte, vu depuis la fiche du licencié (retour du
 * club, 2026-10-01 : "le lien indiqué dans tables devra aussi être associé
 * à la licence du joueur dans /joueurs"). Mêmes données et même action que
 * Tables → Accès publics (club_admin uniquement), rattachées ici à la fiche.
 */
export function LicenciePublicAccessCard({
  clubId,
  clubSlug,
  licencieId,
  licencieName,
  licencieEmail,
  publicAdmin,
  publicCoach,
  publicCoordinator,
  entry,
}: {
  clubId: string;
  clubSlug: string;
  licencieId: string;
  licencieName: string;
  licencieEmail: string | null;
  publicAdmin: boolean;
  publicCoach: boolean;
  publicCoordinator: boolean;
  entry: PublicAccessEntryDto | null;
}) {
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, confirmDialog] = useConfirm();
  // Rôles de l'espace public sans compte (retour du club, 2026-10-01) : admin, puis coach / coordinateur des dérogations.
  const [flags, setFlags] = useState({ publicAdmin, publicCoach, publicCoordinator });
  const [savingFlag, setSavingFlag] = useState<keyof typeof flags | null>(null);

  async function toggleFlag(flag: keyof typeof flags, next: boolean) {
    setFlags((f) => ({ ...f, [flag]: next }));
    setSavingFlag(flag);
    setError(null);
    try {
      await browserApi.licencies.updateProfile(clubId, licencieId, { [flag]: next });
      router.refresh();
    } catch (err) {
      setFlags((f) => ({ ...f, [flag]: !next }));
      setError(err instanceof ApiError ? err.message : "Modification du rôle impossible.");
    } finally {
      setSavingFlag(null);
    }
  }

  const claimed = entry?.claimed === true;
  const since = formatDate(entry?.claimedAt ?? null);
  // Adresse à laquelle partira le prochain lien : celle de la fiche en priorité, sinon celle du lien actif (même règle que club-manager-api).
  const sendTo = licencieEmail ?? entry?.email ?? null;

  async function reset() {
    const ok = await confirm({
      title: "Réinitialiser le lien personnel ?",
      description: `Le lien actuel de ${licencieName} cessera immédiatement de fonctionner. Ses affectations aux tables restent en place ; il pourra redemander un lien, envoyé à l'email de sa fiche.`,
      confirmLabel: "Réinitialiser",
      destructive: true,
    });
    if (!ok) return;

    setResetting(true);
    setError(null);
    try {
      await browserApi.tables.resetPublicAccess(clubId, licencieId);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Réinitialisation impossible.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<Link2 />}
        title="Lien personnel"
        description="Accès sans compte à l'espace public (Tables, et Dérogations pour les admins, coachs et coordinateurs), envoyé par email."
        actions={
          claimed ? (
            <StatusBadge tone="success" size="sm">
              Actif
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral" size="sm">
              Pas encore inscrit
            </StatusBadge>
          )
        }
      />
      <CardDivider />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm text-foreground">
          {claimed ? <p>{since ? `Lien actif depuis le ${since}.` : "Lien actif."}</p> : <p>Aucun lien actif. Il peut le demander depuis l&apos;onglet Tables de l&apos;espace public.</p>}
          <p className="flex items-center gap-2 text-muted">
            <Mail aria-hidden className="size-4 shrink-0 text-subtle" />
            {sendTo ? (
              <span className="min-w-0 truncate">
                Envoi à <span className="font-medium text-foreground">{sendTo}</span>
              </span>
            ) : (
              <span>Aucun email connu — il le saisira à sa première demande.</span>
            )}
          </p>
          <p className="type-meta">
            Lien commun : <span className="type-numeric">/public/{clubSlug}/tables</span>
          </p>
        </div>
        {/* Retour du club, 2026-10-01 : rôles de l'espace public sans compte — aucun droit dans l'espace connecté. */}
        <div className="flex flex-col">
          <Checkbox
            label="Profil admin"
            description="Accès aux dérogations (dont le statut officiel FBI, en lecture) depuis l'espace public, avec son lien personnel."
            checked={flags.publicAdmin}
            disabled={savingFlag !== null}
            onChange={(e) => toggleFlag("publicAdmin", e.target.checked)}
          />
          <Checkbox
            label="Coach"
            description="Peut demander une dérogation pour les matchs à venir du club (aucune équipe à préciser)."
            checked={flags.publicCoach}
            disabled={savingFlag !== null}
            onChange={(e) => toggleFlag("publicCoach", e.target.checked)}
          />
          <Checkbox
            label="Coordinateur"
            description="Reçoit et traite les demandes de dérogation des coachs."
            checked={flags.publicCoordinator}
            disabled={savingFlag !== null}
            onChange={(e) => toggleFlag("publicCoordinator", e.target.checked)}
          />
        </div>
        {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
        {claimed ? (
          <Button variant="secondary" size="sm" loading={resetting} onClick={reset} icon={<RotateCcw />} className="self-start">
            Réinitialiser le lien
          </Button>
        ) : null}
      </div>
      {confirmDialog}
    </Card>
  );
}
