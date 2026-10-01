"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Sheet } from "@/components/ui/Sheet";
import { Toast } from "@/components/ui/Toast";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { TeamDto } from "@/lib/api/clubs";

const NO_TEAM = "";

/**
 * Ajout MANUEL d'une personne (club_admin) — retour du club, 2026-10-01 :
 * « j'ai des coachs qui ne sont pas licenciés dans ce club, donc dans joueurs
 * faut pouvoir en ajouter un manuellement ». Aucune donnée FFBB ; les rôles
 * de l'espace public (Coach, Coordinateur, Admin) se posent dès la création.
 */
export function AddPersonButton({ clubId, teams }: { clubId: string; teams: TeamDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", teamId: NO_TEAM, publicCoach: true, publicCoordinator: false, publicAdmin: false, coachedTeamIds: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await browserApi.licencies.create(clubId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        teamId: form.teamId || null,
        publicCoach: form.publicCoach,
        publicCoordinator: form.publicCoordinator,
        publicAdmin: form.publicAdmin,
        coachedTeamIds: form.publicCoach ? form.coachedTeamIds : [],
      });
      setOpen(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", teamId: NO_TEAM, publicCoach: true, publicCoordinator: false, publicAdmin: false, coachedTeamIds: [] });
      setToast(`${created.firstName} ${created.lastName} ajouté·e.`);
      setTimeout(() => setToast(null), 4000);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ajout impossible pour le moment.");
    } finally {
      setSaving(false);
    }
  }

  const ready = form.firstName.trim() && form.lastName.trim();

  return (
    <>
      {toast ? <Toast message={toast} /> : null}
      <Button variant="secondary" icon={<UserPlus />} onClick={() => setOpen(true)}>
        Ajouter une personne
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter une personne"
        description="Pour quelqu'un qui n'est pas licencié dans ce club (ex. un coach). Elle apparaît dans la liste des joueurs et peut recevoir son lien personnel."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" icon={<UserPlus />} loading={saving} disabled={!ready} onClick={() => submit()}>
              Ajouter
            </Button>
          </div>
        }
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error ? (
            <Notice tone="danger" live>
              {error}
            </Notice>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prénom" required>
              {(props) => <Input {...props} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="off" autoFocus />}
            </Field>
            <Field label="Nom" required>
              {(props) => <Input {...props} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="off" />}
            </Field>
          </div>
          <Field label="Email" optional hint="Son lien personnel y sera envoyé.">
            {(props) => <Input {...props} type="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" placeholder="prenom.nom@exemple.fr" />}
          </Field>
          <Field label="Téléphone" optional>
            {(props) => <Input {...props} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="off" />}
          </Field>
          <Field label="Équipe où il/elle joue" optional>
            {(props) => (
              <Select {...props} value={form.teamId} onChange={(e) => set("teamId", e.target.value)}>
                <option value={NO_TEAM}>Sans équipe</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-[13px] font-medium text-foreground">Rôles (espace public, avec son lien personnel)</legend>
            <Checkbox label="Coach" description="Peut demander une dérogation pour les matchs à venir du club." checked={form.publicCoach} onChange={(e) => set("publicCoach", e.target.checked)} />
            {form.publicCoach && teams.length > 0 ? (
              <div className="mb-2 ml-8 rounded-[var(--radius-md)] border border-border px-3 py-2">
                <p className="text-[12.5px] font-medium text-muted">Équipes coachées — son agenda sur l&apos;accueil</p>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  {teams.map((t) => (
                    <Checkbox
                      key={t.id}
                      label={t.name}
                      checked={form.coachedTeamIds.includes(t.id)}
                      onChange={(e) => set("coachedTeamIds", e.target.checked ? [...form.coachedTeamIds, t.id] : form.coachedTeamIds.filter((id) => id !== t.id))}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <Checkbox label="Coordinateur" description="Reçoit et traite les demandes de dérogation." checked={form.publicCoordinator} onChange={(e) => set("publicCoordinator", e.target.checked)} />
            <Checkbox label="Profil admin" description="Accès aux dérogations, dont le statut officiel FBI en lecture." checked={form.publicAdmin} onChange={(e) => set("publicAdmin", e.target.checked)} />
          </fieldset>
        </form>
      </Sheet>
    </>
  );
}
