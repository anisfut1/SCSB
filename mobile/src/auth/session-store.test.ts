import { describe, expect, it } from "vitest";
import { activePerson, parseState, withClub, withoutClub, type ClubSession } from "./session-store";

const club = (slug: string): ClubSession => ({ clubSlug: slug, clubName: slug, secret: "bmd_x", people: [{ licencieId: "a", firstName: "Lina", lastName: "M", teamId: null }, { licencieId: "b", firstName: "Hugo", lastName: "M", teamId: null }], activeLicencieId: "b" });

describe("sessions de l'app (multi-club)", () => {
  it("lecture tolérante : contenu illisible = aucune session", () => {
    expect(parseState(null).clubs).toEqual({});
    expect(parseState("{oops").clubs).toEqual({});
    expect(parseState(JSON.stringify({ v: 2, clubs: {} })).clubs).toEqual({});
  });
  it("ajout d'un club (actif), retrait : l'actif bascule sur un club restant", () => {
    const one = withClub(parseState(null), club("a"));
    const two = withClub(one, club("b"));
    expect(two.active).toBe("b");
    expect(withoutClub(two, "b").active).toBe("a");
    expect(withoutClub(withoutClub(two, "b"), "a")).toEqual({ v: 1, active: null, clubs: {} });
  });
  it("personne active, ou la première si l'active n'existe plus", () => {
    expect(activePerson(club("a"))?.firstName).toBe("Hugo");
    expect(activePerson({ ...club("a"), activeLicencieId: "zz" })?.firstName).toBe("Lina");
  });
});
