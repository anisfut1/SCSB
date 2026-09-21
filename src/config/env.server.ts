import "server-only";
import { z } from "zod";
import { publicEnv } from "@/config/env.public";

/**
 * Variables d'environnement serveur uniquement.
 *
 * L'import de `server-only` fait échouer le build si ce module est jamais
 * importé (même transitivement) depuis un Client Component : c'est la
 * garantie technique, pas seulement une convention, que
 * SUPABASE_SERVICE_ROLE_KEY ne finit jamais dans le bundle navigateur.
 */
export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: "SUPABASE_SERVICE_ROLE_KEY est requis côté serveur",
  }),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(source: Partial<Record<string, string | undefined>> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    const details = result.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(
      `Variables d'environnement serveur invalides ou manquantes.\n${details}\n` +
        "Vérifie ton fichier .env.local (voir .env.example). Ne jamais commiter cette clé.",
    );
  }

  return result.data;
}

export const serverEnv = {
  ...publicEnv,
  ...parseServerEnv(),
};
