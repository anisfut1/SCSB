"use client";

import { useActionState } from "react";
import { testFbiConnectionAction, type FbiActionResult } from "@/server/actions/fbi-integration";

const initialState: FbiActionResult = { success: false, message: "" };

export function TestFbiConnectionButton() {
  const [state, formAction, isPending] = useActionState(async () => testFbiConnectionAction(), initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
      >
        {isPending ? "Test en cours…" : "Tester la connexion"}
      </button>

      {state.message ? (
        <p role="status" className={`text-sm ${state.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
