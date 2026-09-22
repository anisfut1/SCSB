"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserApi } from "@/lib/api/browserClient";
import { ApiError } from "@/lib/api/client";

/**
 * §20 de la demande : envoyé directement à club-manager-api en HTTPS
 * (Client Component, jamais un Server Action) — jamais stocké dans
 * localStorage, jamais loggé côté frontend, jamais renvoyé après succès.
 * Le champ mot de passe est vidé après un enregistrement réussi.
 *
 * BACKEND_API_GAP (voir docs/MIGRATION_TO_API.md) : l'identifiant FBI déjà
 * enregistré n'est plus pré-rempli — `GET /v1/clubs/:clubId/integrations`
 * n'expose pas le `username` configuré (par choix : seul `configured`/
 * `connected` sont exposés). Le champ reste donc toujours vide au chargement.
 */
export function FbiCredentialsForm({ clubId }: { clubId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const passwordValue = String(formData.get("password") ?? "");

    if (!username) {
      setMessage({ success: false, text: "L'identifiant est requis." });
      return;
    }

    startTransition(async () => {
      try {
        await browserApi.integrations.saveFbi(clubId, { username, password: passwordValue || undefined });
        setMessage({ success: true, text: "Identifiants FBI enregistrés." });
        setPassword("");
        router.refresh();
      } catch (error) {
        setMessage({ success: false, text: error instanceof ApiError ? error.message : "Enregistrement impossible. Réessaie." });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Identifiant FBI
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          placeholder="ex: club0034008"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Mot de passe FBI
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="laisser vide pour ne pas changer un mot de passe déjà enregistré"
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          Jamais affiché ni renvoyé une fois enregistré — chiffré (AES-256-GCM) côté club-manager-api.
        </p>
      </div>

      {message ? (
        <p role="status" className={`text-sm ${message.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/85"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
