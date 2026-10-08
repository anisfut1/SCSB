"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { apiFetch, ApiError } from "@/lib/api/client";

/** Mot de passe oublié : POST /v1/account/password-reset (réponse identique que le compte existe ou non). */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiFetch("/v1/account/password-reset", { method: "POST", body: { email: email.trim() } });
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La demande n'a pas pu partir. Réessaie dans un instant.");
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success" icon={<MailCheck />} title="Regarde ta boîte mail">
          Si un compte existe pour <span className="font-medium text-foreground">{sentTo}</span>, un email « Nouveau mot de passe » vient de partir. Pas reçu d&apos;ici quelques minutes ? Regarde dans tes indésirables.
        </Notice>
        <ButtonLink href="/login" variant="ghost" icon={<ArrowLeft />}>
          Retour à la connexion
        </ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-5">
      <Field label="Email" required>
        {(props) => <Input {...props} name="email" type="email" autoComplete="email" inputMode="email" placeholder="vous@club.fr" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      {error ? (
        <Notice tone="danger" live>
          {error}
        </Notice>
      ) : null}
      <Button type="submit" variant="primary" size="lg" loading={pending} iconRight={pending ? undefined : <ArrowRight />} disabled={!email.trim()} className="w-full">
        Recevoir le lien
      </Button>
      <ButtonLink href="/login" variant="ghost" icon={<ArrowLeft />}>
        Retour à la connexion
      </ButtonLink>
    </form>
  );
}
