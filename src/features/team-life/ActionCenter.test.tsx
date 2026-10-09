// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDeviceToken, setStoredPublicToken } from "@/lib/publicToken";
import { ActionCenter } from "./ActionCenter";

const actionCenter = vi.fn();
const respond = vi.fn();
vi.mock("@/lib/api/teamLife", () => ({ publicTeamLife: { actionCenter: (...a: unknown[]) => actionCenter(...a), respond: (...a: unknown[]) => respond(...a) } }));

const training = (id: string, teamId: string, startsAt: string) => ({
  id,
  seriesId: "s",
  team: { id: teamId, name: teamId === "u15" ? "U15 (F)" : "U11 (M)" },
  startsAt,
  endsAt: startsAt.replace("T17:00", "T18:30"),
  location: { clubVenueId: null, label: "Gymnase test", address: null },
  status: "scheduled",
  cancelReason: null,
  isModified: false,
  counts: null,
  canManage: false,
});

const DTO = {
  people: [
    { tokenIndex: 0, licencieId: "lina", firstName: "Lina", lastName: "M", team: { id: "u15", name: "U15 (F)" }, coachTeams: [] },
    { tokenIndex: 1, licencieId: "tom", firstName: "Tom", lastName: "M", team: { id: "u11", name: "U11 (M)" }, coachTeams: [] },
  ],
  invalidTokenIndexes: [],
  actions: [
    { type: "TRAINING_RESPONSE", licencieId: "lina", firstName: "Lina", training: training("t1", "u15", "2099-10-13T17:00:00.000Z"), currentResponse: null },
    { type: "TRAINING_RESPONSE", licencieId: "tom", firstName: "Tom", training: training("t2", "u11", "2099-10-14T17:00:00.000Z"), currentResponse: null },
  ],
  upcoming: [],
};

beforeEach(() => {
  window.localStorage.clear();
  actionCenter.mockReset().mockResolvedValue(DTO);
  respond.mockReset();
  // Deux enfants sur ce téléphone : Lina (lien actif) et Tom.
  addDeviceToken("sete", "lien-tom");
  addDeviceToken("sete", "lien-lina");
  setStoredPublicToken("sete", "lien-lina");
});
afterEach(cleanup);

describe("Home « À faire »", () => {
  it("fusionne les liens de l'appareil et répond avec le lien de l'enfant concerné", async () => {
    respond.mockResolvedValue({});
    render(<ActionCenter clubSlug="sete" timezone="Europe/Paris" activeToken="lien-lina" onAddPerson={() => undefined} />);
    expect(await screen.findByText(/Tom — entraînement/)).toBeTruthy();
    expect(actionCenter).toHaveBeenCalledWith("sete", ["lien-lina", "lien-tom"]);

    const tomGroup = screen.getByRole("group", { name: "Réponse pour Tom" });
    fireEvent.click(tomGroup.querySelector("button")!); // Présent·e
    expect(tomGroup.querySelector("button")!.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() => expect(respond).toHaveBeenCalledWith("sete", "lien-tom", "t2", "PRESENT"));
  });

  it("échec : la réponse revient en arrière avec un message", async () => {
    respond.mockRejectedValue(new Error("réseau"));
    render(<ActionCenter clubSlug="sete" timezone="Europe/Paris" activeToken="lien-lina" onAddPerson={() => undefined} />);
    const group = await screen.findByRole("group", { name: "Réponse pour Lina" });
    fireEvent.click(group.querySelectorAll("button")[1]!); // Absent·e
    expect(await screen.findByText("Impossible d'enregistrer la réponse.")).toBeTruthy();
    expect(group.querySelectorAll("button")[1]!.getAttribute("aria-pressed")).toBe("false");
  });

  it("rien à répondre : « Tout est à jour »", async () => {
    actionCenter.mockResolvedValue({ ...DTO, actions: [] });
    render(<ActionCenter clubSlug="sete" timezone="Europe/Paris" activeToken="lien-lina" onAddPerson={() => undefined} />);
    expect(await screen.findByText("Tout est à jour")).toBeTruthy();
  });
});
