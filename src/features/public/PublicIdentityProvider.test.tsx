// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConsumedPublicToken } from "@/lib/publicToken";
import { PublicIdentityProvider, usePublicIdentity } from "./PublicIdentityProvider";

const getPublicMe = vi.fn();
vi.mock("@/lib/api/publicTables", () => ({ getPublicMe: (...args: unknown[]) => getPublicMe(...args) }));

const T = "jeton-factice-0002";
const PATH = "/public/sete/matchs";

function Probe() {
  const { identity } = usePublicIdentity();
  return <p data-testid="state">{identity === undefined ? "loading" : identity === null ? "none" : identity.licencie.firstName}</p>;
}

function mount() {
  return render(
    <StrictMode>
      <PublicIdentityProvider clubSlug="sete" club={{ name: "Sète", logoUrl: null }}>
        <Probe />
      </PublicIdentityProvider>
    </StrictMode>,
  );
}

beforeEach(() => {
  getPublicMe.mockReset();
  window.localStorage.clear();
  window.history.replaceState(null, "", PATH);
});
afterEach(() => {
  cleanup();
  resetConsumedPublicToken();
});

describe("PublicIdentityProvider — double montage StrictMode (jsdom)", () => {
  it("jeton en fragment : identité résolue malgré le double effet, URL nettoyée, un seul jeton validé", async () => {
    window.history.replaceState(null, "", `${PATH}#token=${T}`);
    getPublicMe.mockResolvedValue({ licencie: { id: "l1", firstName: "Camille", lastName: "Test" }, isClubAdmin: false, derogationRequests: { canCreate: false, canManage: false }, tables: { canManage: false } });

    mount();

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("Camille"));
    expect(window.location.href).not.toContain(T);
    expect(window.location.hash).toBe("");
    expect(getPublicMe.mock.calls.every((c) => c[0] === "sete" && c[1] === T)).toBe(true);
    expect(window.localStorage.getItem("scsb:public-token:sete")).toBe(T);
  });

  it("jeton invalide : URL nettoyée quand même, jeton non conservé, identité absente", async () => {
    window.history.replaceState(null, "", `${PATH}?token=${T}`);
    getPublicMe.mockRejectedValue(new Error("401"));

    mount();

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("none"));
    expect(window.location.href).not.toContain(T);
    expect(window.localStorage.getItem("scsb:public-token:sete")).toBeNull();
  });
});
