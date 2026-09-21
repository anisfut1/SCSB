/**
 * Configuration du worker, uniquement depuis des variables d'environnement
 * (jamais de fichier de config commité — voir README.md "Secrets").
 */
function required(source: NodeJS.ProcessEnv, name: string): string {
  const value = source[name];
  if (!value) {
    throw new Error(`Variable d'environnement requise manquante : ${name} (voir worker/README.md)`);
  }
  return value;
}

function optionalInt(source: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = source[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface WorkerConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  fbiEncryptionKey: Buffer;
  workerId: string;
  /** Intervalle entre deux tentatives de claim quand la file est vide (ms). */
  pollIntervalMs: number;
  /** Nombre de jobs traités EN PARALLÈLE par cette instance (§12 du brief FBI : commencer bas, ex. 2-3). Un seul job actif par club quel que soit ce nombre (garanti par claim_next_fbi_job). */
  concurrency: number;
  /** Port HTTP pour /health (§48 du brief FBI). */
  healthPort: number;
  fbiBaseUrl: string;
}

export function loadWorkerConfig(source: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const keyBase64 = required(source, "FBI_CREDENTIALS_ENCRYPTION_KEY");
  const key = Buffer.from(keyBase64, "base64");

  if (key.length !== 32) {
    throw new Error("FBI_CREDENTIALS_ENCRYPTION_KEY doit être 32 octets encodés en base64 (clé AES-256) — voir worker/README.md");
  }

  return {
    supabaseUrl: required(source, "SUPABASE_URL"),
    supabaseServiceRoleKey: required(source, "SUPABASE_SERVICE_ROLE_KEY"),
    fbiEncryptionKey: key,
    workerId: source.WORKER_ID ?? `worker-${process.pid}`,
    pollIntervalMs: optionalInt(source, "WORKER_POLL_INTERVAL_MS", 15_000),
    concurrency: optionalInt(source, "WORKER_CONCURRENCY", 2),
    healthPort: optionalInt(source, "PORT", 8080),
    fbiBaseUrl: source.FBI_BASE_URL ?? "https://extranet.ffbb.com/fbi",
  };
}
