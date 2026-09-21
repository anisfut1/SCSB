import { z } from "zod";

/**
 * Variables d'environnement sûres à lire depuis un bundle navigateur.
 * Next.js les inline au build : elles DOIVENT commencer par `NEXT_PUBLIC_`.
 *
 * Ce module ne doit jamais importer `server-only` ni référencer un secret :
 * il est utilisé aussi bien par des Server Components que par des
 * Client Components (ex: `lib/supabase/browser.ts`).
 */
export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL doit être une URL valide (ex: https://xxxx.supabase.co)",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY est requis",
  }),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/**
 * Fonction pure (source explicite plutôt que `process.env` lu en dur) pour
 * rester facilement testable — voir env.public.test.ts.
 */
export function parsePublicEnv(source: Partial<Record<string, string | undefined>> = process.env): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(
      `Variables d'environnement publiques invalides ou manquantes.\n${details}\n` +
        "Vérifie ton fichier .env.local (voir .env.example).",
    );
  }

  return result.data;
}

export const publicEnv = parsePublicEnv();
