import { decryptSecret } from "./crypto.js";
import type { WorkerSupabaseClient } from "./supabase-client.js";

export interface FbiCredentials {
  username: string;
  password: string;
}

/**
 * Lit et déchiffre les identifiants FBI d'UN club précis. `clubId` sert
 * d'AAD (§52 du brief FBI) : le worker ne peut déchiffrer un ciphertext
 * qu'en fournissant exactement le club_id auquel il appartient — un
 * ciphertext déplacé par erreur vers un autre club ne se déchiffre jamais.
 * Le mot de passe en clair ne transite qu'en mémoire, jamais loggé.
 */
export async function getFbiCredentials(
  supabase: WorkerSupabaseClient,
  fbiEncryptionKey: Buffer,
  clubId: string,
): Promise<FbiCredentials | null> {
  const { data, error } = await supabase
    .from("fbi_credentials")
    .select("username, password_ciphertext, password_iv, password_auth_tag")
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture des identifiants FBI échouée : ${error.message}`);
  }

  if (!data) return null;

  const password = decryptSecret(
    { ciphertext: data.password_ciphertext, iv: data.password_iv, authTag: data.password_auth_tag },
    fbiEncryptionKey,
    clubId,
  );

  return { username: data.username, password };
}
