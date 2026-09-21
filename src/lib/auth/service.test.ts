import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signInWithPassword, signOut } from "./service";
import type { Database } from "@/types/database";

function createMockSupabase(overrides?: { signInError?: { message: string }; signOutError?: { message: string } }) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {},
        error: overrides?.signInError ?? null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: overrides?.signOutError ?? null }),
    },
  } as unknown as SupabaseClient<Database>;
}

describe("signInWithPassword", () => {
  it("rejette un email invalide sans appeler Supabase", async () => {
    const supabase = createMockSupabase();

    const result = await signInWithPassword(supabase, { email: "pas-un-email", password: "secret123" });

    expect(result.error).toBe("Email invalide");
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("rejette un mot de passe vide sans appeler Supabase", async () => {
    const supabase = createMockSupabase();

    const result = await signInWithPassword(supabase, { email: "coach@scsete-basket.fr", password: "" });

    expect(result.error).toBe("Mot de passe requis");
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("appelle Supabase avec des identifiants valides et ne remonte pas d'erreur en cas de succès", async () => {
    const supabase = createMockSupabase();

    const result = await signInWithPassword(supabase, {
      email: "coach@scsete-basket.fr",
      password: "secret123",
    });

    expect(result.error).toBeNull();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "coach@scsete-basket.fr",
      password: "secret123",
    });
  });

  it("renvoie un message générique (pas de détail Supabase) si l'authentification échoue", async () => {
    const supabase = createMockSupabase({ signInError: { message: "Invalid login credentials" } });

    const result = await signInWithPassword(supabase, {
      email: "coach@scsete-basket.fr",
      password: "mauvais-mot-de-passe",
    });

    expect(result.error).toBe("Email ou mot de passe incorrect");
  });
});

describe("signOut", () => {
  it("ne renvoie pas d'erreur en cas de succès", async () => {
    const supabase = createMockSupabase();

    const result = await signOut(supabase);

    expect(result.error).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("renvoie un message d'erreur si la déconnexion échoue côté Supabase", async () => {
    const supabase = createMockSupabase({ signOutError: { message: "network error" } });

    const result = await signOut(supabase);

    expect(result.error).toBe("La déconnexion a échoué, réessaie.");
  });
});
