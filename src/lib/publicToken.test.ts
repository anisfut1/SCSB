// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStoredPublicToken, consumePublicTokenFromUrl, getStoredPublicToken, hrefWithoutToken, resetConsumedPublicToken, setStoredPublicToken, tokenFromHref } from "./publicToken";

const BASE = "https://front.test.example/public/sete/matchs";
const T = "jeton-factice-0001";

describe("caractérisation — lecture d'origine du jeton (?token=, toujours acceptée)", () => {
  it("lit ?token= dans la query", () => {
    expect(tokenFromHref(`${BASE}?token=${T}`)).toBe(T);
  });
  it("aucun jeton : null", () => {
    expect(tokenFromHref(BASE)).toBeNull();
    expect(tokenFromHref(`${BASE}?equipe=U15`)).toBeNull();
  });
  it("retire ?token= en gardant les autres paramètres et le hash", () => {
    expect(hrefWithoutToken(`${BASE}?token=${T}&tab=x#ancre`)).toBe("/public/sete/matchs?tab=x#ancre");
  });
  it("rien à retirer sans ?token=", () => {
    expect(hrefWithoutToken(BASE)).toBeNull();
  });
});

describe("R-014 — jeton en fragment (#token=)", () => {
  it("lit #token=", () => {
    expect(tokenFromHref(`${BASE}#token=${T}`)).toBe(T);
  });
  it("le fragment est prioritaire sur la query", () => {
    expect(tokenFromHref(`${BASE}?token=ancien#token=${T}`)).toBe(T);
  });
  it("fragment vide : retombe sur la query ; un simple ancre n'est pas un jeton", () => {
    expect(tokenFromHref(`${BASE}?token=${T}#token=`)).toBe(T);
    expect(tokenFromHref(`${BASE}#ancre`)).toBeNull();
  });
  it("retire le fragment, et la query, sans toucher aux autres paramètres", () => {
    expect(hrefWithoutToken(`${BASE}#token=${T}`)).toBe("/public/sete/matchs");
    expect(hrefWithoutToken(`${BASE}?tab=x&token=${T}#token=${T}`)).toBe("/public/sete/matchs?tab=x");
    expect(hrefWithoutToken(`${BASE}#a=1&token=${T}&b=2`)).toBe("/public/sete/matchs#a=1&b=2");
  });
  it("un fragment sans jeton est laissé intact", () => {
    expect(hrefWithoutToken(`${BASE}#ancre`)).toBeNull();
  });
});

describe("consumePublicTokenFromUrl — vrai window jsdom", () => {
  const PATH = "/public/sete/matchs";

  beforeEach(() => {
    window.history.replaceState(null, "", PATH);
  });
  afterEach(() => {
    resetConsumedPublicToken();
    window.history.replaceState(null, "", "/");
  });

  const open = (suffix: string) => window.history.replaceState({ k: 1 }, "", `${PATH}${suffix}`);

  it("fragment : renvoie le jeton ; l'URL réelle n'en contient plus (ni query, ni fragment)", () => {
    open(`#token=${T}`);
    expect(consumePublicTokenFromUrl()).toBe(T);
    expect(window.location.href).not.toContain(T);
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(PATH);
  });
  it("query d'un ancien lien : renvoie le jeton ; URL nettoyée, autres paramètres conservés", () => {
    open(`?tab=x&token=${T}`);
    expect(consumePublicTokenFromUrl()).toBe(T);
    expect(window.location.search).toBe("?tab=x");
    expect(window.location.href).not.toContain(T);
  });
  it("les deux : le fragment est prioritaire, et l'URL n'a plus aucun jeton", () => {
    open(`?token=ancien-jeton#token=${T}`);
    expect(consumePublicTokenFromUrl()).toBe(T);
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("");
  });
  it("conserve l'état d'historique et ne crée pas d'entrée supplémentaire", () => {
    open(`#token=${T}`);
    const before = window.history.length;
    consumePublicTokenFromUrl();
    expect(window.history.state).toEqual({ k: 1 });
    expect(window.history.length).toBe(before);
  });
  it("un fragment d'ancre sans jeton est laissé intact, sans replaceState", () => {
    open("#ancre");
    const spy = vi.spyOn(window.history, "replaceState");
    expect(consumePublicTokenFromUrl()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#ancre");
    spy.mockRestore();
  });
  it("double lecture (StrictMode) : la seconde, URL déjà nettoyée, retrouve le jeton", () => {
    open(`#token=${T}`);
    consumePublicTokenFromUrl();
    expect(window.location.href).not.toContain(T);
    expect(consumePublicTokenFromUrl()).toBe(T);
  });
  it("après reset (oublier ce navigateur) : plus de jeton", () => {
    open(`#token=${T}`);
    consumePublicTokenFromUrl();
    resetConsumedPublicToken();
    expect(consumePublicTokenFromUrl()).toBeNull();
  });
  it("replaceState qui échoue : le jeton est quand même renvoyé", () => {
    open(`#token=${T}`);
    const spy = vi.spyOn(window.history, "replaceState").mockImplementation(() => {
      throw new Error("x");
    });
    expect(consumePublicTokenFromUrl()).toBe(T);
    spy.mockRestore();
  });
});

describe("persistance localStorage (vrai storage jsdom)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("écrit, relit et efface par club", () => {
    setStoredPublicToken("sete", T);
    expect(window.localStorage.getItem("scsb:public-token:sete")).toBe(T);
    expect(getStoredPublicToken("sete")).toBe(T);
    expect(getStoredPublicToken("autre")).toBeNull();
    clearStoredPublicToken("sete");
    expect(getStoredPublicToken("sete")).toBeNull();
  });

  it("storage indisponible : aucune exception", () => {
    for (const method of ["getItem", "setItem", "removeItem"] as const) {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new Error("blocked");
      });
    }
    expect(getStoredPublicToken("sete")).toBeNull();
    expect(() => setStoredPublicToken("sete", T)).not.toThrow();
    expect(() => clearStoredPublicToken("sete")).not.toThrow();
  });
});

describe("plusieurs liens sur le même appareil (un par enfant)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("mémorise chaque lien validé, l'actif en premier, sans doublon", async () => {
    const { addDeviceToken, getDeviceTokens } = await import("./publicToken");
    addDeviceToken("sete", "lien-lina");
    setStoredPublicToken("sete", "lien-lina");
    addDeviceToken("sete", "lien-tom");
    setStoredPublicToken("sete", "lien-tom");
    expect(getDeviceTokens("sete")).toEqual(["lien-tom", "lien-lina"]);
    addDeviceToken("sete", "lien-lina");
    setStoredPublicToken("sete", "lien-lina");
    expect(getDeviceTokens("sete")).toEqual(["lien-lina", "lien-tom"]);
    expect(getDeviceTokens("autre-club")).toEqual([]);
  });

  it("oublie un lien révoqué, ou tous", async () => {
    const { addDeviceToken, clearDeviceTokens, getDeviceTokens, removeDeviceTokens } = await import("./publicToken");
    addDeviceToken("sete", "a");
    addDeviceToken("sete", "b");
    removeDeviceTokens("sete", ["a"]);
    expect(getDeviceTokens("sete")).toEqual(["b"]);
    clearDeviceTokens("sete");
    clearStoredPublicToken("sete");
    expect(getDeviceTokens("sete")).toEqual([]);
  });
});
