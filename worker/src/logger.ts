/**
 * Copie volontairement indépendante de src/lib/logger.ts (voir README.md
 * "Pourquoi dupliquer") : même format JSON structuré, sans dépendance sur
 * l'app Next.js. Ne jamais logger : mot de passe, cookie, jeton, contenu de
 * document, nom complet de joueur (§42 du brief FBI).
 */
type LogContext = Record<string, unknown>;

function format(level: "info" | "error", message: string, context?: LogContext) {
  return JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context });
}

export function logInfo(message: string, context?: LogContext): void {
  console.log(format("info", message, context));
}

export function logError(message: string, error?: unknown, context?: LogContext): void {
  const errorDetails = error instanceof Error ? { errorMessage: error.message } : error ? { error } : {};
  console.error(format("error", message, { ...context, ...errorDetails }));
}
