/**
 * Copie volontairement indépendante de src/lib/fbi/errors.ts (voir
 * README.md "Pourquoi dupliquer").
 */
export type FbiErrorCode =
  | "LOGIN_PAGE_UNREACHABLE"
  | "LOGIN_FORM_NOT_RECOGNIZED"
  | "LOGIN_FAILED"
  | "SESSION_EXPIRED"
  | "EMARQUE_DOWNLOAD_ENDPOINT_NOT_CONFIRMED"
  | "REQUEST_FAILED"
  | "NAVIGATION_FAILED";

export class FbiError extends Error {
  constructor(
    message: string,
    readonly code: FbiErrorCode,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FbiError";
  }
}

export type FbiLoginStatus = "CONNECTED" | "INVALID_CREDENTIALS" | "FBI_UNAVAILABLE" | "AUTH_FLOW_CHANGED" | "UNKNOWN_ERROR";

export function classifyFbiLoginStatus(error: unknown): FbiLoginStatus {
  if (!error) return "CONNECTED";
  if (!(error instanceof FbiError)) return "UNKNOWN_ERROR";

  switch (error.code) {
    case "LOGIN_FAILED":
      return "INVALID_CREDENTIALS";
    case "LOGIN_PAGE_UNREACHABLE":
    case "REQUEST_FAILED":
    case "NAVIGATION_FAILED":
      return "FBI_UNAVAILABLE";
    case "LOGIN_FORM_NOT_RECOGNIZED":
      return "AUTH_FLOW_CHANGED";
    default:
      return "UNKNOWN_ERROR";
  }
}
