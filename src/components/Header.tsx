"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { footerHelpNavigation, primaryNavigation } from "@/navigation";
export function Header() {
  const [menu, setMenu] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressComplete, setProgressComplete] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pendingHrefRef = useRef<string | null>(null);
  const pendingStartedAt = useRef(0);
  const routeReadyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathname = useRef(pathname);
  const { cart, openCart } = useCart();
  const { slugs: favoriteSlugs } = useFavorites();
  const count = cart?.totalQuantity ?? 0;
  const pendingLabel =
    primaryNavigation.find(({ href }) => href === pendingHref)?.label ??
    footerHelpNavigation.find(({ href }) => href === pendingHref)?.label ??
    (pendingHref === "/cuenta" ? "inicio de sesión" : "la sección");

  const clearMenuTimers = () => {
    if (routeReadyTimer.current) clearTimeout(routeReadyTimer.current);
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    routeReadyTimer.current = null;
    menuCloseTimer.current = null;
  };

  const dismissMenu = () => {
    clearMenuTimers();
    pendingHrefRef.current = null;
    setPendingHref(null);
    setProgressVisible(false);
    setProgressComplete(false);
    setMenuClosing(false);
    setMenu(false);
  };

  const closeMenuAfterReady = () => {
    pendingHrefRef.current = null;
    setPendingHref(null);
    setProgressComplete(true);
    setMenuClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    menuCloseTimer.current = setTimeout(() => {
      menuCloseTimer.current = null;
      setProgressVisible(false);
      setProgressComplete(false);
      setMenu(false);
      setMenuClosing(false);
    }, reduceMotion ? 0 : 460);
  };

  const navigateFromMenu = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    event.preventDefault();
    if (pendingHrefRef.current === href || menuClosing) return;

    clearMenuTimers();
    setMenuClosing(false);
    if (href === pathname) {
      closeMenuAfterReady();
      return;
    }

    pendingHrefRef.current = href;
    pendingStartedAt.current = Date.now();
    setProgressVisible(true);
    setProgressComplete(false);
    setPendingHref(href);
    router.push(href);
  };

  useEffect(() => {
    const onRouteReady = (event: Event) => {
      const readyPath = (event as CustomEvent<string>).detail;
      if (!readyPath || readyPath !== pendingHrefRef.current) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setProgressComplete(true);
      const visibleFor = reduceMotion ? 0 : 280;
      const remaining = Math.max(0, visibleFor - (Date.now() - pendingStartedAt.current));
      if (routeReadyTimer.current) clearTimeout(routeReadyTimer.current);
      routeReadyTimer.current = setTimeout(() => {
        routeReadyTimer.current = null;
        if (pendingHrefRef.current !== readyPath) return;
        closeMenuAfterReady();
      }, remaining);
    };

    window.addEventListener("eulan:route-ready", onRouteReady);
    return () => {
      window.removeEventListener("eulan:route-ready", onRouteReady);
      clearMenuTimers();
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (pathname === "/") {
      document.getElementById("contenido")?.focus({ preventScroll: true });
    }
  }, [pathname]);

  return (
    <>
      <header
        className={`site-header navbar${pathname.startsWith("/productos/") ? " site-header--product" : ""}`}
      >
        <div className="navbar-start">
          <button
            className="mobile-trigger icon-button btn btn-ghost"
            type="button"
            aria-label="Abrir menú"
            aria-haspopup="dialog"
            aria-expanded={menu}
            onClick={() => {
              clearMenuTimers();
              pendingHrefRef.current = null;
              setPendingHref(null);
              setProgressVisible(false);
              setProgressComplete(false);
              setMenuClosing(false);
              setMenu(true);
            }}
          >
            <Icon name="menu" />
            <span>Menú</span>
          </button>
          <nav aria-label="Principal">
            <ul className="desktop-nav menu menu-horizontal">
              {primaryNavigation.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={pathname === href ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="navbar-center">
          <Link className="brand" href="/" aria-label="eulán, inicio">
            <Image
              src="/assets/logo.svg"
              alt="eulán"
              width={134}
              height={41}
              priority
            />
          </Link>
        </div>
        <div className="navbar-end header-actions">
          <Link className="header-icon-link" href="/cuenta" aria-label="Iniciar sesión en mi cuenta">
            <Icon name="user" />
          </Link>
          <Link className="header-icon-link header-favorites-link" href="/favoritos" aria-label={`Ver favoritos, ${favoriteSlugs.length} piezas`}>
            <Icon name="heart" />
            {favoriteSlugs.length > 0 && <span className="header-icon-count" aria-hidden="true">{favoriteSlugs.length}</span>}
          </Link>
          <button
            className="cart-trigger btn btn-ghost"
            onClick={(event) => openCart(event.currentTarget)}
            aria-label={`Abrir bolsa de compras, ${count} productos`}
          >
            <Icon name="cart" />
            <span className="cart-count" aria-hidden="true">
              {count}
            </span>
          </button>
        </div>
      </header>
      <Modal
        open={menu}
        onClose={dismissMenu}
        title="Menú"
        className={`drawer menu-dialog${menuClosing ? " is-closing" : ""}${progressVisible ? " is-loading" : ""}${progressComplete ? " is-ready" : ""}`}
      >
        {pendingHref && (
          <span className="sr-only" role="status">
            Cargando {pendingLabel}
          </span>
        )}
        <nav className="mobile-menu-primary" aria-label="Secciones principales">
          <ul className="menu menu-vertical">
            {primaryNavigation.map(({ href, label }) => {
              const isCurrentPage = pathname === href;
              const isLoading = pendingHref === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isCurrentPage ? "page" : undefined}
                    aria-busy={isLoading || undefined}
                    className={isLoading ? "is-loading" : undefined}
                    onClick={(event) => navigateFromMenu(href, event)}
                  >
                    <span className="mobile-menu-link-content">
                      <span
                        className={`mobile-menu-active-dot${isCurrentPage ? " is-active" : ""}`}
                        aria-hidden="true"
                      />
                      <span className="mobile-menu-link-label">{label}</span>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mobile-menu-utilities">
          <Link
            className="mobile-account-link"
            href="/cuenta"
            aria-busy={pendingHref === "/cuenta" || undefined}
            onClick={(event) => navigateFromMenu("/cuenta", event)}
          >
            <span className="mobile-menu-utility-label">
              <Icon name="user" />
              Iniciar sesión
            </span>
            <Icon name="arrow" />
          </Link>
        </div>
        <nav className="mobile-menu-footer-links" aria-label="Información y ayuda">
          {footerHelpNavigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-busy={pendingHref === href || undefined}
              className={pendingHref === href ? "is-loading" : undefined}
              onClick={(event) => navigateFromMenu(href, event)}
            >
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </Modal>
    </>
  );
}
export function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={pathname === "/" ? "home-frame" : "interior-frame"}>
      {children}
    </div>
  );
}
