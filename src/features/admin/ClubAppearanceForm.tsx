"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, RotateCcw, Save, Trash2 } from "lucide-react";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, Input } from "@/components/ui/Field";
import { ClubLogo } from "@/components/ui/Logo";
import { FALLBACK_ACCENT } from "@/lib/ui/accent";

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Côté max du logo importé : assez pour un écran Retina (80 px affichés au plus), assez petit pour rester léger. */
const LOGO_MAX_SIDE = 256;

/**
 * Redimensionne une image choisie localement (jamais envoyée brute) et la
 * renvoie en data URL PNG — `logoUrl` accepte toute URL valide côté API
 * (PATCH /v1/clubs/:clubId) et il n'existe pas de stockage de fichiers pour
 * les logos : une image de 256 px reste de l'ordre de quelques dizaines de Ko.
 */
async function fileToLogoDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

/**
 * Apparence du club (retour du club, 2026-10-01 : « dans l'admin faut un
 * truc pour mettre le logo du club ») : logo (URL ou fichier importé) et
 * couleur d'accent, via PATCH /v1/clubs/:clubId (club_admin uniquement,
 * même verrou côté API).
 */
export function ClubAppearanceForm({ clubId, clubName, logoUrl, accentColor }: { clubId: string; clubName: string; logoUrl: string | null; accentColor: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [logo, setLogo] = useState(logoUrl ?? "");
  const [accent, setAccent] = useState(accentColor ?? "");
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const isDataUrl = logo.startsWith("data:");
  const logoValid = logo === "" || isDataUrl || /^https?:\/\//i.test(logo);
  const accentValid = accent === "" || HEX.test(accent);

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus({ kind: "error", text: "Choisis une image (PNG, JPG, SVG, WebP)." });
      return;
    }
    try {
      setLogo(await fileToLogoDataUrl(file));
      setStatus(null);
    } catch {
      setStatus({ kind: "error", text: "Impossible de lire cette image." });
    }
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      try {
        await browserApi.clubs.update(clubId, { logoUrl: logo.trim() || null, accentColor: accent ? accent.toUpperCase() : null });
        setStatus({ kind: "success", text: "Apparence enregistrée." });
        router.refresh();
      } catch (error) {
        setStatus({ kind: "error", text: error instanceof ApiError ? error.message : "Enregistrement impossible." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <ClubLogo name={clubName} src={logo || null} size="xl" />
          <span className="type-meta text-xs">Aperçu</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Field label="Logo du club" hint="Colle l'adresse d'une image, ou importe un fichier depuis ton appareil." error={logoValid ? undefined : "Adresse invalide (doit commencer par https://)."}>
            {(props) => (
              <Input
                {...props}
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={isDataUrl ? "Image importée depuis l'appareil" : logo}
                readOnly={isDataUrl}
                onChange={(e) => setLogo(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={onFile} aria-hidden />
            <Button variant="secondary" size="sm" icon={<ImageUp />} onClick={() => fileRef.current?.click()}>
              Importer une image
            </Button>
            {logo ? (
              <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={() => setLogo("")}>
                Retirer le logo
              </Button>
            ) : null}
            {logo !== (logoUrl ?? "") ? (
              <Button variant="ghost" size="sm" icon={<RotateCcw />} onClick={() => setLogo(logoUrl ?? "")}>
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Field label="Couleur d'accent" hint="Boutons principaux, onglet actif, sélection. Laisse vide pour la couleur par défaut." error={accentValid ? undefined : "Format attendu : #RRGGBB."}>
        {(props) => (
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Choisir la couleur"
              value={HEX.test(accent) ? accent : FALLBACK_ACCENT}
              onChange={(e) => setAccent(e.target.value.toUpperCase())}
              className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-border-strong bg-surface-raised p-1 sm:h-10"
            />
            <Input {...props} value={accent} onChange={(e) => setAccent(e.target.value.trim())} placeholder={`${FALLBACK_ACCENT} (par défaut)`} className="type-numeric max-w-44 uppercase" />
            {accent ? (
              <Button variant="ghost" size="sm" onClick={() => setAccent("")}>
                Par défaut
              </Button>
            ) : null}
          </div>
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button variant="primary" loading={isPending} disabled={!logoValid || !accentValid} onClick={save} icon={<Save />}>
          {isPending ? "Enregistrement…" : "Enregistrer l'apparence"}
        </Button>
        {status ? <FormMessage tone={status.kind === "success" ? "success" : "danger"}>{status.text}</FormMessage> : null}
      </div>
    </div>
  );
}
