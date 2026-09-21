import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

// getClubContext/listUserClubs (les fonctions testées ici) n'appellent
// jamais notFound()/redirect() elles-mêmes (voir requireClubContext pour
// ça), mais le module les importe au niveau fichier — sans ce mock,
// next/navigation plante en dehors du runtime Next.js réel.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

interface FakeClub {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  accent_color: string | null;
  timezone: string;
  status: "active" | "suspended";
  ffbb_club_id: string;
}

interface FakeMembership {
  id: string;
  club_id: string;
  user_id: string;
  status: "active" | "suspended";
}

interface FakeRoleRow {
  membership_id: string;
  role: string;
}

function buildFakeSupabase(state: { clubs: FakeClub[]; memberships: FakeMembership[]; roles: FakeRoleRow[] }) {
  return {
    from(table: string) {
      if (table === "clubs") {
        return {
          select: () => ({
            eq: (_col: string, slug: string) => ({
              maybeSingle: () => Promise.resolve({ data: state.clubs.find((c) => c.slug === slug) ?? null, error: null }),
            }),
            in: (_col: string, ids: string[]) => Promise.resolve({ data: state.clubs.filter((c) => ids.includes(c.id)), error: null }),
          }),
        };
      }
      if (table === "club_memberships") {
        return {
          select: (cols: string) => {
            if (cols === "id") {
              // getClubContext: eq(club_id).eq(user_id).eq(status).maybeSingle()
              return {
                eq: (_c1: string, clubId: string) => ({
                  eq: (_c2: string, userId: string) => ({
                    eq: (_c3: string, status: string) => ({
                      maybeSingle: () =>
                        Promise.resolve({
                          data: state.memberships.find((m) => m.club_id === clubId && m.user_id === userId && m.status === status) ?? null,
                          error: null,
                        }),
                    }),
                  }),
                }),
              };
            }
            // listUserClubs: eq(user_id).eq(status)
            return {
              eq: (_c1: string, userId: string) => ({
                eq: (_c2: string, status: string) =>
                  Promise.resolve({ data: state.memberships.filter((m) => m.user_id === userId && m.status === status), error: null }),
              }),
            };
          },
        };
      }
      if (table === "membership_roles") {
        return {
          select: () => ({
            eq: (_col: string, membershipId: string) => Promise.resolve({ data: state.roles.filter((r) => r.membership_id === membershipId), error: null }),
            in: (_col: string, membershipIds: string[]) =>
              Promise.resolve({ data: state.roles.filter((r) => membershipIds.includes(r.membership_id)), error: null }),
          }),
        };
      }
      throw new Error(`Table inattendue dans le fake Supabase de test : ${table}`);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

let fakeSupabaseState: { clubs: FakeClub[]; memberships: FakeMembership[]; roles: FakeRoleRow[] };

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => buildFakeSupabase(fakeSupabaseState)),
}));

import { getClubContext, listUserClubs } from "./club-context";

const CLUB_A: FakeClub = {
  id: "club-a",
  slug: "club-a",
  name: "Club A Basket",
  short_name: null,
  logo_url: null,
  accent_color: null,
  timezone: "Europe/Paris",
  status: "active",
  ffbb_club_id: "AAA0000001",
};

const CLUB_B: FakeClub = { ...CLUB_A, id: "club-b", slug: "club-b", name: "Club B Basket", ffbb_club_id: "BBB0000002" };

const USER_A: User = { id: "user-a" } as User;
const USER_B: User = { id: "user-b" } as User;

beforeEach(() => {
  fakeSupabaseState = {
    clubs: [CLUB_A, CLUB_B],
    memberships: [
      { id: "membership-a1", club_id: "club-a", user_id: "user-a", status: "active" },
      { id: "membership-b1", club_id: "club-b", user_id: "user-b", status: "active" },
    ],
    roles: [
      { membership_id: "membership-a1", role: "club_admin" },
      { membership_id: "membership-b1", role: "joueur" },
    ],
  };
});

describe("getClubContext", () => {
  it("renvoie null si le club n'existe pas (jamais de distinction avec 'pas membre')", async () => {
    const context = await getClubContext("club-inexistant", USER_A);
    expect(context).toBeNull();
  });

  it("renvoie null si l'utilisateur n'est PAS membre du club (isolation cross-tenant)", async () => {
    const context = await getClubContext("club-b", USER_A);
    expect(context).toBeNull();
  });

  it("renvoie le contexte complet (club + rôles) pour un membre actif", async () => {
    const context = await getClubContext("club-a", USER_A);
    expect(context).not.toBeNull();
    expect(context?.club.slug).toBe("club-a");
    expect(context?.membershipId).toBe("membership-a1");
    expect(context?.roles).toEqual(["club_admin"]);
  });

  it("ne mélange jamais les rôles de deux clubs différents pour un même utilisateur", async () => {
    fakeSupabaseState.memberships.push({ id: "membership-a2", club_id: "club-a", user_id: "user-b", status: "active" });
    fakeSupabaseState.roles.push({ membership_id: "membership-a2", role: "coach" });

    const contextInA = await getClubContext("club-a", USER_B);
    const contextInB = await getClubContext("club-b", USER_B);

    expect(contextInA?.roles).toEqual(["coach"]);
    expect(contextInB?.roles).toEqual(["joueur"]);
  });

  it("renvoie null pour un membership suspendu (status != active)", async () => {
    fakeSupabaseState.memberships[0]!.status = "suspended";
    const context = await getClubContext("club-a", USER_A);
    expect(context).toBeNull();
  });
});

describe("listUserClubs", () => {
  it("renvoie un tableau vide pour un utilisateur sans membership", async () => {
    const clubs = await listUserClubs("user-inconnu");
    expect(clubs).toEqual([]);
  });

  it("renvoie uniquement les clubs dont l'utilisateur est membre, avec ses rôles respectifs", async () => {
    fakeSupabaseState.memberships.push({ id: "membership-b2", club_id: "club-b", user_id: "user-a", status: "active" });
    fakeSupabaseState.roles.push({ membership_id: "membership-b2", role: "parent" });

    const clubs = await listUserClubs("user-a");

    expect(clubs).toHaveLength(2);
    const clubA = clubs.find((c) => c.slug === "club-a");
    const clubB = clubs.find((c) => c.slug === "club-b");
    expect(clubA?.roles).toEqual(["club_admin"]);
    expect(clubB?.roles).toEqual(["parent"]);
  });

  it("n'inclut jamais un club dont le membership est suspendu", async () => {
    fakeSupabaseState.memberships.push({ id: "membership-b3", club_id: "club-b", user_id: "user-a", status: "suspended" });

    const clubs = await listUserClubs("user-a");

    expect(clubs.map((c) => c.slug)).toEqual(["club-a"]);
  });
});
