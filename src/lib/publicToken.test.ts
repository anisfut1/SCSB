import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("consumePublicTokenFromUrl — lecture puis nettoyage immédiat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetConsumedPublicToken();
  });

  function stubWindow(href: string) {
    const replaceState = vi.fn();
    vi.stubGlobal("window", { location: { href }, history: { state: { k: 1 }, replaceState } });
    return replaceState;
  }

  it("fragment : renvoie le jeton et retire l'URL (ni query, ni fragment)", () => {
    const replaceState = stubWindow(`${BASE}#token=${T}`);
    expect(consumePublicTokenFromUrl()).toBe(T);
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ k: 1 }, "", "/public/sete/matchs");
  });
  it("query d'un ancien lien : renvoie le jeton et retire l'URL", () => {
    const replaceState = stubWindow(`${BASE}?token=${T}`);
    expect(consumePublicTokenFromUrl()).toBe(T);
    expect(replaceState).toHaveBeenCalledExactlyOnceWith({ k: 1 }, "", "/public/sete/matchs");
  });
  it("sans jeton : null, URL non touchée", () => {
    const replaceState = stubWindow(BASE);
    expect(consumePublicTokenFromUrl()).toBeNull();
    expect(replaceState).not.toHaveBeenCalled();
  });
  it("seconde lecture après nettoyage (StrictMode) : retrouve le jeton déjà lu", () => {
    stubWindow(`${BASE}#token=${T}`);
    consumePublicTokenFromUrl();
    stubWindow(BASE);
    expect(consumePublicTokenFromUrl()).toBe(T);
  });
  it("après reset (oublier ce navigateur) : plus de jeton", () => {
    stubWindow(`${BASE}#token=${T}`);
    consumePublicTokenFromUrl();
    resetConsumedPublicToken();
    stubWindow(BASE);
    expect(consumePublicTokenFromUrl()).toBeNull();
  });
  it("replaceState qui échoue : le jeton est quand même renvoyé", () => {
    vi.stubGlobal("window", { location: { href: `${BASE}#token=${T}` }, history: { state: null, replaceState: () => { throw new Error("x"); } } });
    expect(consumePublicTokenFromUrl()).toBe(T);
  });
});

describe("persistance localStorage (inchangée)", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubStorage() {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
    return store;
  }

  it("écrit, relit et efface par club", () => {
    const store = stubStorage();
    setStoredPublicToken("sete", T);
    expect(store.get("scsb:public-token:sete")).toBe(T);
    expect(getStoredPublicToken("sete")).toBe(T);
    expect(getStoredPublicToken("autre")).toBeNull();
    clearStoredPublicToken("sete");
    expect(getStoredPublicToken("sete")).toBeNull();
  });

  it("storage indisponible : aucune exception", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(getStoredPublicToken("sete")).toBeNull();
    expect(() => setStoredPublicToken("sete", T)).not.toThrow();
    expect(() => clearStoredPublicToken("sete")).not.toThrow();
  });
});
