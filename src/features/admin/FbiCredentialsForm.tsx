"use client";

import { useActionState } from "react";
import { saveFbiCredentialsAction, type FbiActionResult } from "@/server/actions/fbi-integration";

const initialState: FbiActionResult = { success: false, message: "" };

interface FbiCredentialsFormProps {
  currentUsername: string | null;
}

export function FbiCredentialsForm({ currentUsername }: FbiCredentialsFormProps) {
  const [state, formAction, isPending] = useActionState(saveFbiCredentialsAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Identifiant FBI
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          defaultValue={currentUsername ?? ""}
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
          placeholder={currentUsername ? "••••••••  (laisser vide pour ne pas changer)" : ""}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-base outline-none focus:border-black/40 dark:border-white/20 dark:bg-black dark:focus:border-white/40"
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          Jamais affiché ni renvoyé une fois enregistré — stocké chiffré (AES-256-GCM) côté serveur.
        </p>
      </div>

      {state.message ? (
        <p role="status" className={`text-sm ${state.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
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
