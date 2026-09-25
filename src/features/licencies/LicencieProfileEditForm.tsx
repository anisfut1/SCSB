"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import type { LicencieDto } from "@/lib/api/licencies";

type Status = { kind: "success" | "error"; text: string } | null;

/**
 * Formulaire d'édition de la fiche joueur (demande du club : "agrémenter
 * soit en admin avec photo, infos persos etc, ou bien le joueur direct
 * s'il a un compte associé à son profil"). Deux jeux de champs distincts,
 * décidés CÔTÉ SERVEUR (voir `[licencieId]/page.tsx`) — jamais recalculés
 * ici : le serveur (club-manager-api) rejette de toute façon (400) tout
 * champ hors de la population autorisée pour l'appelant, voir
 * docs/LICENCIES.md côté club-manager-api. `mode="admin"` expose
 * l'identité complète, `mode="self"` UNIQUEMENT le contact/la photo.
 */
export function LicencieProfileEditForm({ clubId, licencie, mode }: { clubId: string; licencie: LicencieDto; mode: "admin" | "self" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>(null);
  const [firstName, setFirstName] = useState(licencie.firstName);
  const [lastName, setLastName] = useState(licencie.lastName);
  const [licenseNumber, setLicenseNumber] = useState(licencie.licenseNumber ?? "");
  const [birthDate, setBirthDate] = useState(licencie.birthDate ?? "");
  const [active, setActive] = useState(licencie.active);
  const [photoUrl, setPhotoUrl] = useState(licencie.photoUrl ?? "");
  const [email, setEmail] = useState(licencie.email ?? "");
  const [phone, setPhone] = useState(licencie.phone ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      try {
        const contactFields = { photoUrl: photoUrl.trim() || null, email: email.trim() || null, phone: phone.trim() || null };
        const body = mode === "admin" ? { ...contactFields, firstName, lastName, licenseNumber: licenseNumber.trim() || null, birthDate: birthDate || null, active } : contactFields;

        await browserApi.licencies.updateProfile(clubId, licencie.id, body);
        setStatus({ kind: "success", text: "Profil mis à jour." });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Mise à jour impossible." });
      }
    });
  }

  const inputClassName = "mt-1 w-full rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/20 dark:bg-transparent";
  const labelClassName = "block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {mode === "admin" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClassName}>
              Prénom
              <input className={inputClassName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label className={labelClassName}>
              Nom
              <input className={inputClassName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClassName}>
              Numéro de licence
              <input className={inputClassName} value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </label>
            <label className={labelClassName}>
              Date de naissance
              <input type="date" className={inputClassName} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Licencié·e actif·ve
          </label>
        </>
      ) : null}

      <label className={labelClassName}>
        Photo (URL)
        <input type="url" placeholder="https://…" className={inputClassName} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClassName}>
          Email
          <input type="email" className={inputClassName} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={labelClassName}>
          Téléphone
          <input className={inputClassName} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {status ? (
          <p role="status" className={`text-sm ${status.kind === "success" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {status.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}
