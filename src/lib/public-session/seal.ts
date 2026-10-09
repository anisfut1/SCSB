import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Scellage du cookie de session persistante de l'espace public (module PUR,
 * Node uniquement — jamais importé par un composant client).
 *
 * Le contenu est CHIFFRÉ et authentifié (AES-256-GCM) : le cookie est déjà
 * `HttpOnly`, mais le chiffrer évite en plus qu'un jeton personnel apparaisse
 * en clair dans une sauvegarde d'appareil, un proxy ou un rapport d'erreur.
 * La clé dérive de `SESSION_SECRET` ; changer `SESSION_EPOCH` (ou le secret)
 * révoque d'un coup toutes les sessions émises.
 */

export interface SessionPayload {
  v: 1;
  /** Slug du club : le cookie n'est jamais valable pour un autre club. */
  slug: string;
  /** Époque de révocation globale (`SESSION_EPOCH`). */
  epoch: string;
  /** Première émission (ms) : plafond absolu de la durée de vie. */
  firstIssuedAt: number;
  /** Dernier renouvellement (ms) : base du glissement. */
  issuedAt: number;
  /** Jetons personnels validés par l'API, le jeton actif en premier. */
  tokens: string[];
}

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(`scsb-public-session:${secret}`).digest();
}

export function sealSession(payload: SessionPayload, secret: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openSession(sealed: string | undefined, secret: string): SessionPayload | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length <= IV_BYTES + TAG_BYTES) return null;
    const decipher = createDecipheriv(ALGORITHM, deriveKey(secret), raw.subarray(0, IV_BYTES));
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    const json = Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString("utf8");
    const parsed: unknown = JSON.parse(json);
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    p.v === 1 &&
    typeof p.slug === "string" &&
    typeof p.epoch === "string" &&
    typeof p.firstIssuedAt === "number" &&
    typeof p.issuedAt === "number" &&
    Array.isArray(p.tokens) &&
    p.tokens.every((t) => typeof t === "string" && t.length > 0)
  );
}
