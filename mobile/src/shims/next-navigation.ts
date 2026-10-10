import { useMemo } from "react";
import { useLocation, useNavigate, useParams as useRouterParams } from "react-router";
import { isInternalHref, openExternal } from "../links/external";

/**
 * `next/navigation` pour l'app (Client Components seulement : les pages
 * serveur du site ne sont jamais embarquées). `refresh()` relance l'écran
 * courant (événement écouté par l'écran), comme `router.refresh()` côté web.
 */
export const REFRESH_EVENT = "bm:refresh";

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      // `options.scroll` (Next) : sans objet dans l'app, la position est gérée par le routeur.
      push: (href: string, _options?: { scroll?: boolean }) => (isInternalHref(href) ? navigate(href) : openExternal(href)),
      replace: (href: string, _options?: { scroll?: boolean }) => (isInternalHref(href) ? navigate(href, { replace: true }) : openExternal(href)),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => window.dispatchEvent(new Event(REFRESH_EVENT)),
      prefetch: () => undefined,
    }),
    [navigate],
  );
}

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string>>(): T {
  return useRouterParams() as T;
}

export class NotFoundError extends Error {}
export function notFound(): never {
  throw new NotFoundError("NOT_FOUND");
}
export function redirect(href: string): never {
  window.location.assign(href);
  throw new Error("REDIRECT");
}
