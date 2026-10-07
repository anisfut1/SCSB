import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));
vi.mock("@/lib/tenancy/club-context", () => ({ requireClubAdminContext: vi.fn().mockResolvedValue({ id: "club-1" }) }));
const logError = vi.fn();
vi.mock("@/lib/logger", () => ({ logError: (...args: unknown[]) => logError(...args) }));

const update = vi.fn();
vi.mock("@/lib/api/server", () => ({ api: { clubs: { update: (...args: unknown[]) => update(...args) } } }));

// Les erreurs typées viennent du vrai module (instanceof) ; seule la redirection Next est simulée.
vi.mock("next/navigation", () => ({
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
  },
}));

import { ApiError, ApiUnreachableError } from "@/lib/api/client";
import { updateClubSettingsAction } from "./club-settings";

const initial = { success: false, message: "" };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue({});
});

describe("updateClubSettingsAction", () => {
  it("enregistre un fuseau valide", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", short_name: "SCSB", timezone: "Europe/Paris" }));

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith("club-1", { name: "SC Sète", shortName: "SCSB", timezone: "Europe/Paris" });
  });

  it("rejette un fuseau inconnu sans jamais appeler l'API", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "xyz" }));

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/fuseau/i);
    expect(update).not.toHaveBeenCalled();
  });

  it("retombe sur Europe/Paris quand le fuseau est vide (comportement existant)", async () => {
    await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "" }));

    expect(update).toHaveBeenCalledWith("club-1", { name: "SC Sète", shortName: null, timezone: "Europe/Paris" });
  });

  it("rejette un nom vide (comportement existant)", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: " ", timezone: "Europe/Paris" }));

    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rafraîchit les pages du club après un enregistrement réussi", async () => {
    await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "Europe/Paris" }));

    expect(revalidatePath).toHaveBeenCalledWith("/c/sete/admin/settings");
    expect(revalidatePath).toHaveBeenCalledWith("/c/sete");
  });

  it("échec d'écriture : message générique, erreur journalisée, aucune page rafraîchie", async () => {
    update.mockRejectedValue(new ApiError(500, "INTERNAL_ERROR", "Erreur serveur"));

    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "Europe/Paris" }));

    expect(result).toEqual({ success: false, message: "Enregistrement impossible. Réessaie." });
    expect(logError).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("validation refusée par l'API (422) : le message du back est renvoyé, rien n'est journalisé", async () => {
    update.mockRejectedValue(new ApiError(422, "VALIDATION_ERROR", "Fuseau horaire inconnu."));

    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "Europe/Paris" }));

    expect(result).toEqual({ success: false, message: "Fuseau horaire inconnu." });
    expect(logError).not.toHaveBeenCalled();
  });

  it("droits insuffisants (403) et service injoignable : messages dédiés", async () => {
    update.mockRejectedValueOnce(new ApiError(403, "FORBIDDEN", "interdit"));
    expect((await updateClubSettingsAction("sete", initial, form({ name: "X", timezone: "Europe/Paris" }))).message).toMatch(/droits/);

    update.mockRejectedValueOnce(new ApiUnreachableError(new Error("réseau")));
    expect((await updateClubSettingsAction("sete", initial, form({ name: "X", timezone: "Europe/Paris" }))).message).toMatch(/indisponible/);
  });

  it("session expirée (redirection /login) : la redirection n'est jamais avalée", async () => {
    update.mockRejectedValue(new Error("NEXT_REDIRECT:/login"));

    await expect(updateClubSettingsAction("sete", initial, form({ name: "X", timezone: "Europe/Paris" }))).rejects.toThrow("NEXT_REDIRECT:/login");
  });
});
