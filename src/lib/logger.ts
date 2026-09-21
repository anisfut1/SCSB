/**
 * Logger minimal côté serveur. Pas de plateforme externe (Sentry, etc.) en
 * Phase 0 — uniquement une sortie structurée sur la console, suffisante pour
 * les logs Vercel. À remplacer par un vrai outil le jour où le besoin est
 * avéré, sans changer les appels grâce à cette petite indirection.
 */

type LogContext = Record<string, unknown>;

function format(level: "info" | "error", message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

export function logInfo(message: string, context?: LogContext): void {
  console.log(format("info", message, context));
}

export function logError(message: string, error?: unknown, context?: LogContext): void {
  const errorDetails =
    error instanceof Error ? { errorMessage: error.message, stack: error.stack } : error ? { error } : {};

  console.error(format("error", message, { ...context, ...errorDetails }));
}
