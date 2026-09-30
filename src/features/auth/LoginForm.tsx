"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { signInAction } from "@/server/actions/auth";
import type { AuthActionResult } from "@/lib/auth/service";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";

const initialState: AuthActionResult = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <Field label="Email" required>
        {(props) => <Input {...props} name="email" type="email" autoComplete="email" inputMode="email" placeholder="vous@club.fr" />}
      </Field>

      <Field label="Mot de passe" required>
        {(props) => (
          <span className="relative flex">
            <Input {...props} name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-12" />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[9px] text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </span>
        )}
      </Field>

      {state.error ? (
        <Notice tone="danger" live>
          {state.error}
        </Notice>
      ) : null}

      <Button type="submit" variant="primary" size="lg" loading={isPending} iconRight={isPending ? undefined : <ArrowRight />} className="mt-1 w-full">
        {isPending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
