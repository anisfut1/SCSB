import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getClaims = vi.fn();
const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getClaims, getUser } })),
}));

import { proxy } from "./proxy";

function request(path: string) {
  return new NextRequest(`https://app.example.test${path}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy (garde d'authentification)", () => {
  it("redirige un visiteur non connecté vers /login en conservant la destination", async () => {
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    const response = await proxy(request("/c/sete/dashboard"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirectTo")).toBe("/c/sete/dashboard");
  });

  it("laisse passer un utilisateur dont le JWT est valide", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    const response = await proxy(request("/c/sete/dashboard"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("laisse passer les routes publiques sans session", async () => {
    getClaims.mockResolvedValue({ data: null, error: { message: "no session" } });

    for (const path of ["/login", "/public/sete/matchs"]) {
      const response = await proxy(request(path));
      expect(response.headers.get("location")).toBeNull();
    }
  });

  it("une seule vérification d'auth par requête, sans getUser() direct", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });

    await proxy(request("/c/sete/matchs"));

    expect(getClaims).toHaveBeenCalledTimes(1);
    expect(getUser).not.toHaveBeenCalled();
  });
});
