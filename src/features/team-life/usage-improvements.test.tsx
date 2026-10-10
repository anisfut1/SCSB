// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AvailabilityCard } from "./MatchActionCards";
import { collectTeams } from "./PublicTeamsApp";
import { reminderText } from "./RemindBlock";

afterEach(cleanup);

const match = { id: "m1", team: { id: "u15", name: "U15 (F)" }, startsAt: "2026-10-17T16:00:00.000Z", isHome: true, opponent: "Agde", venueName: null, venueAddress: null, status: "scheduled" };

describe("Améliorations d'usage (retour du club, 2026-10-10)", () => {
  it("texte de relance à partager : prénoms seulement", () => {
    expect(reminderText("availability", match, ["Lina", "Emma"], "Europe/Paris")).toBe("Rappel : merci de donner vos disponibilités sur Ball Manager pour U15 (F) contre Agde (Sam. 17 oct. · 18:00). En attente : Lina, Emma.");
    expect(reminderText("convocation", match, ["Lina"], "Europe/Paris")).toContain("confirmer la convocation");
  });

  it("accueil : « Le coach attend ta réponse » seulement tant que la personne n'a pas répondu", () => {
    const action = { type: "MATCH_AVAILABILITY" as const, licencieId: "l", firstName: "Lina", match, currentResponse: null, reminded: true };
    render(<AvailabilityCard action={action} timezone="Europe/Paris" value={null} saving={false} onRespond={() => undefined} />);
    expect(screen.getByText("Le coach attend ta réponse")).toBeTruthy();
    cleanup();
    render(<AvailabilityCard action={action} timezone="Europe/Paris" value="AVAILABLE" saving={false} onRespond={() => undefined} />);
    expect(screen.queryByText("Le coach attend ta réponse")).toBeNull();
  });

  it("onglet Équipe : une entrée par équipe, équipes coachées d'abord, prénoms de l'appareil", () => {
    const teams = collectTeams([
      { licencie: { firstName: "Claire" }, teams: [{ id: "sf", name: "Seniors F", relation: "PLAYER" }, { id: "sf", name: "Seniors F", relation: "COACH" }] },
      { licencie: { firstName: "Hugo" }, teams: [{ id: "s1m", name: "Seniors 1 M", relation: "PLAYER" }] },
    ]);
    expect(teams).toEqual([
      { id: "sf", name: "Seniors F", coach: true, who: ["Claire"] },
      { id: "s1m", name: "Seniors 1 M", coach: false, who: ["Hugo"] },
    ]);
  });
});
