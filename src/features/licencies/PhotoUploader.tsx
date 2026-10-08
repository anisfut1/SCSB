"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { PersonAvatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/Field";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { compressPhoto } from "@/lib/images/compress-photo";

/**
 * Photo de la fiche joueur (retour du club, 2026-10-08) : choisir une image
 * (PNG, JPEG…), compressée dans le navigateur (WebP 512 px, ~30-60 Ko)
 * puis stockée par l'API. Enregistrée immédiatement, sans passer par le
 * bouton « Enregistrer » du formulaire.
 */
export function PhotoUploader({ clubId, licencieId, name, photoUrl, onChange }: { clubId: string; licencieId: string; name: string; photoUrl: string | null; onChange: (url: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "delete" | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function upload(file: File) {
    setBusy("upload");
    setMessage(null);
    try {
      const photo = await compressPhoto(file);
      const updated = await browserApi.licencies.uploadPhoto(clubId, licencieId, { contentType: photo.contentType, data: photo.base64 });
      onChange(updated.photoUrl);
      setMessage({ tone: "success", text: `Photo enregistrée (${Math.round(file.size / 1024)} Ko → ${Math.max(1, Math.round(photo.bytes / 1024))} Ko).` });
    } catch (error) {
      setMessage({ tone: "danger", text: error instanceof ApiError || error instanceof Error ? error.message : "Envoi impossible." });
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy("delete");
    setMessage(null);
    try {
      await browserApi.licencies.deletePhoto(clubId, licencieId);
      onChange(null);
      setMessage({ tone: "success", text: "Photo retirée." });
    } catch (error) {
      setMessage({ tone: "danger", text: error instanceof ApiError ? error.message : "Suppression impossible." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-sm font-medium text-foreground">Photo</span>
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar name={name} src={photoUrl} size="xl" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choisir une photo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button variant="secondary" size="sm" icon={<Camera />} loading={busy === "upload"} disabled={busy !== null} onClick={() => input.current?.click()}>
            {photoUrl ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {photoUrl ? (
            <Button variant="ghost" size="sm" icon={<Trash2 />} loading={busy === "delete"} disabled={busy !== null} onClick={remove}>
              Retirer
            </Button>
          ) : null}
        </div>
      </div>
      <p className="type-meta">PNG, JPEG ou autre image : recadrée en carré et compressée automatiquement avant l&apos;envoi.</p>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
    </div>
  );
}
