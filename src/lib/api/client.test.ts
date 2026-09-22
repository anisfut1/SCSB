import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError, ApiUnreachableError } from "./client";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("apiFetch", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("appelle NEXT_PUBLIC_CLUB_MANAGER_API_URL + le chemin donné (§4 de la demande : jamais une URL en dur)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch("/v1/clubs");

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.test.example.com/v1/clubs");
  });

  it("transmet le jeton d'accès en Authorization: Bearer (§6 de la demande)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch("/v1/clubs", { accessToken: "jwt-de-test" });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer jwt-de-test");
  });

  it("n'envoie aucun en-tête Authorization sans jeton", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiFetch("/v1/clubs");

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
  });

  it("renvoie le corps JSON sur 200", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { clubs: [{ id: "1" }] }));

    const result = await apiFetch<{ clubs: { id: string }[] }>("/v1/clubs");

    expect(result).toEqual({ clubs: [{ id: "1" }] });
  });

  it.each([
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [422, "VALIDATION_ERROR"],
    [500, "INTERNAL_ERROR"],
  ])("lève une ApiError typée sur %i", async (status, code) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: { code, message: `erreur ${status}` } }));

    const error = await apiFetch("/v1/clubs").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(status);
    expect((error as ApiError).code).toBe(code);
  });

  it("expose isUnauthorized/isForbidden/isNotFound", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: { code: "UNAUTHORIZED", message: "non authentifié" } }));

    const error = (await apiFetch("/v1/clubs").catch((e: unknown) => e)) as ApiError;

    expect(error.isUnauthorized).toBe(true);
    expect(error.isForbidden).toBe(false);
    expect(error.isNotFound).toBe(false);
  });

  it("retombe sur un message générique si le corps d'erreur n'est pas du JSON valide", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502 Bad Gateway</html>", { status: 502 }));

    const error = (await apiFetch("/v1/clubs").catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe("UNKNOWN_ERROR");
  });

  it("lève une ApiUnreachableError sur un échec réseau (§44 de la demande)", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await apiFetch("/v1/clubs").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiUnreachableError);
  });

  it("sérialise le body et pose Content-Type: application/json pour une requête POST", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { saved: true }));

    await apiFetch("/v1/clubs/abc/integrations/fbi", { method: "POST", body: { username: "u", password: "p" } });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = init.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ username: "u", password: "p" }));
  });

  it("utilise cache: no-store par défaut (§41 de la demande : jamais de cache croisé multi-tenant)", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await apiFetch("/v1/clubs");

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.cache).toBe("no-store");
  });
});
