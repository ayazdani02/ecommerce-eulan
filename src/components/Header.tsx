"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { primaryNavigation } from "@/navigation";
export function Header() {
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const { cart, openCart } = useCart();
  const { slugs: favoriteSlugs } = useFavorites();
  const count = cart?.totalQuantity ?? 0;

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
            onClick={() => setMenu(true)}
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
          <a className="header-icon-link" href="https://gg0kzc-em.myshopify.com/account/login" aria-label="Ingresar a mi cuenta en Shopify">
            <Icon name="user" />
          </a>
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
        onClose={() => setMenu(false)}
        title="Menú"
        className="drawer menu-dialog"
      >
        <nav aria-label="Secciones del sitio">
          <ul className="menu menu-vertical">
            {[
              ...primaryNavigation.map(
                ({ href, label }) => [href, label] as const,
              ),
              ["/catalogo", "TODA LA COLECCIÓN"],
              ["/buscar", "BUSCAR"],
              ["/contacto", "CONTACTO"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} onClick={() => setMenu(false)}>
                  <span>{label}</span>
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="mobile-menu-utilities" aria-label="Tu cuenta">
          <ul className="menu menu-vertical">
            <li>
              <a
                href="https://gg0kzc-em.myshopify.com/account/login"
                onClick={() => setMenu(false)}
              >
                <span className="mobile-menu-utility-label">
                  <Icon name="user" />
                  Iniciar sesión
                </span>
                <Icon name="arrow" />
              </a>
            </li>
          </ul>
        </nav>
        <p className="menu-footnote">Joyería contemporánea, Chile.</p>
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
