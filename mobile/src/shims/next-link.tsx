import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import { isInternalHref, openExternal } from "../links/external";

/**
 * `next/link` pour l'app : les liens de l'espace public restent DANS l'app
 * (même chemin que le web) ; tout le reste (espace club `/c/*`, sites tiers,
 * mailto, tel) s'ouvre dans Safari / l'app système — jamais avalé par la WebView.
 */
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string; query?: Record<string, string> };
  children?: ReactNode;
  prefetch?: boolean | null;
  scroll?: boolean;
  replace?: boolean;
};

function hrefToString(href: Props["href"]): string {
  if (typeof href === "string") return href;
  const qs = href.query ? `?${new URLSearchParams(href.query).toString()}` : "";
  return `${href.pathname ?? ""}${qs}`;
}

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch: _prefetch, scroll: _scroll, replace, children, onClick, ...rest }, ref) {
  const to = hrefToString(href);
  if (!isInternalHref(to)) {
    return (
      <a
        ref={ref}
        href={to}
        {...rest}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          event.preventDefault();
          openExternal(to);
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <RouterLink ref={ref} to={to} replace={replace} onClick={onClick} {...rest}>
      {children}
    </RouterLink>
  );
});

export default Link;
