// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TeamOverviewDto } from "@/lib/api/teamLife";
import { attendanceLabel, TeamPageView } from "./TeamPageView";
import { teamTabOf } from "./team-tab";

afterEach(cleanup);

const lic = (id: string, firstName: string, lastName: string) => ({ id, firstName, lastName, photoUrl: null });
const overview = (canManage: boolean): TeamOverviewDto => ({
  team: { id: "u15", name: "U15 (F)" },
  canManage,
  nextMatch: {
    id: "m1",
    startsAt: "2026-10-17T16:00:00.000Z",
    isHome: true,
    opponent: "Agde",
    venueName: "Gymnase A",
    convocation: canManage ? { sent: true, convoked: 10, confirmed: 7, declined: 1, pending: 2 } : null,
    availability: canManage ? { open: true, noResponse: 0 } : null,
  },
  nextTraining: null,
  roster: [
    { licencie: lic("c1", "Coach", "Un"), isCoach: true, hasPersonalLink: canManage ? true : null, attendance: canManage ? { sessions: 8, absent: 0, late: 0 } : null },
    { licencie: lic("p1", "Joueuse", "Deux"), isCoach: false, hasPersonalLink: canManage ? false : null, attendance: canManage ? { sessions: 8, absent: 2, late: 1 } : null },
  ],
});

function renderPage(tab: "apercu" | "effectif", canManage: boolean) {
  render(
    <TeamPageView
      tab={tab}
      basePath="/c/sete/equipes/u15"
      timezone="Europe/Paris"
      loadOverview={() => Promise.resolve(overview(canManage))}
      loadPlanning={vi.fn()}
      matchHref={(id) => `/c/sete/matchs/${id}`}
      manageTrainingsHref="/c/sete/entrainements?equipe=u15"
    />,
  );
}

describe("Page Équipe (Lot 4)", () => {
  it("onglet par défaut : vue d'ensemble", () => {
    expect(teamTabOf(undefined)).toBe("apercu");
    expect(teamTabOf("effectif")).toBe("effectif");
    expect(teamTabOf("n'importe quoi")).toBe("apercu");
  });

  it("coach : état de la convocation et lien vers la gestion du match", async () => {
    renderPage("apercu", true);
    expect(await screen.findByText(/Convocation envoyée : 10 convoqués · 7 confirmés · 1 refus · 2 en attente/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Gérer le match/ }).getAttribute("href")).toBe("/c/sete/matchs/m1#vie-equipe");
    expect(screen.getByRole("link", { name: /Gérer les entraînements/ })).toBeTruthy();
  });

  it("joueur : ni convocation des autres, ni gestion", async () => {
    renderPage("apercu", false);
    expect(await screen.findByRole("link", { name: /Voir le match/ })).toBeTruthy();
    expect(screen.queryByText(/Convocation envoyée/)).toBeNull();
    expect(screen.queryByRole("link", { name: /Gérer les entraînements/ })).toBeNull();
  });

  it("effectif : badge Coach, statut du lien réservé aux gestionnaires", async () => {
    renderPage("effectif", true);
    expect(await screen.findByText("1 / 2 avec un lien personnel actif")).toBeTruthy();
    expect(screen.getByText("Lien actif")).toBeTruthy();
    expect(screen.getByText("Sans lien")).toBeTruthy();
    // Assiduité (coach / admin) : « Joueuse : 2 absences · 1 retard sur les 8 dernières séances ».
    expect(screen.getByText("Assiduité sur les 8 dernières séances relevées.")).toBeTruthy();
    expect(screen.getByText("2 absences · 1 retard")).toBeTruthy();
    cleanup();
    renderPage("effectif", false);
    expect(await screen.findByText("Coach")).toBeTruthy();
    expect(screen.queryByText("Sans lien")).toBeNull();
    expect(screen.queryByText(/Assiduité/)).toBeNull();
  });

  it("libellé d'assiduité", () => {
    expect(attendanceLabel({ absent: 0, late: 0 })).toBe("Toujours là");
    expect(attendanceLabel({ absent: 1, late: 0 })).toBe("1 absence");
    expect(attendanceLabel({ absent: 0, late: 3 })).toBe("3 retards");
  });
});
