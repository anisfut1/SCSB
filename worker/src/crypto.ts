import { createDecipheriv } from "node:crypto";

/**
 * Copie volontairement indépendante de src/lib/security/crypto.ts (voir
 * README.md "Pourquoi dupliquer") : même algorithme (AES-256-GCM, AAD =
 * club_id), mais SEULEMENT le déchiffrement — le worker ne chiffre jamais
 * rien, il ne fait que lire des identifiants déjà chiffrés par l'app.
 *
 * §52 du brief FBI : le worker n'est autorisé à déchiffrer QUE pour le club
 * dont il traite le job (aad = ce club_id précis, jamais un autre).
 */

const ALGORITHM = "aes-256-gcm";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export class DecryptionError extends Error {
  constructor(cause?: unknown) {
    super("Déchiffrement impossible (clé incorrecte ou données corrompues)");
    this.name = "DecryptionError";
    this.cause = cause;
  }
}

export function decryptSecret(payload: EncryptedPayload, key: Buffer, aad: string): string {
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(payload.ciphertext, "base64")), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    throw new DecryptionError(error);
  }
}
