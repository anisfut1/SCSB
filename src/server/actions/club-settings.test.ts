import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/tenancy/club-context", () => ({ requireClubAdminContext: vi.fn().mockResolvedValue({ id: "club-1" }) }));
vi.mock("@/lib/logger", () => ({ logError: vi.fn() }));

const eq = vi.fn().mockResolvedValue({ error: null });
const update = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ update }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ from })) }));

import { updateClubSettingsAction } from "./club-settings";

const initial = { success: false, message: "" };

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  eq.mockResolvedValue({ error: null });
});

describe("updateClubSettingsAction", () => {
  it("enregistre un fuseau valide", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", short_name: "SCSB", timezone: "Europe/Paris" }));

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({ name: "SC Sète", short_name: "SCSB", timezone: "Europe/Paris" });
  });

  it("rejette un fuseau inconnu sans jamais écrire en base", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "xyz" }));

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/fuseau/i);
    expect(from).not.toHaveBeenCalled();
  });

  it("retombe sur Europe/Paris quand le fuseau est vide (comportement existant)", async () => {
    await updateClubSettingsAction("sete", initial, form({ name: "SC Sète", timezone: "" }));

    expect(update).toHaveBeenCalledWith({ name: "SC Sète", short_name: null, timezone: "Europe/Paris" });
  });

  it("rejette un nom vide (comportement existant)", async () => {
    const result = await updateClubSettingsAction("sete", initial, form({ name: " ", timezone: "Europe/Paris" }));

    expect(result.success).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
