"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, Input } from "@/components/ui/Field";

export function PasswordField({ label, name, value, onChange, autoComplete, hint, error }: { label: string; name: string; value: string; onChange: (v: string) => void; autoComplete: string; hint?: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} required hint={hint} error={error}>
      {(props) => (
        <span className="relative flex">
          <Input {...props} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="pr-12" />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={show}
            className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[9px] text-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </span>
      )}
    </Field>
  );
}
