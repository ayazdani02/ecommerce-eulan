import type { ReactNode } from "react";

type LoadingRegionProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

function LoadingRegion({ label, children, className = "" }: LoadingRegionProps) {
  return (
    <div className={`route-loading ${className}`}>
      <span className="sr-only" role="status">{label}</span>
      <div className="route-loading__visual" aria-hidden="true">{children}</div>
    </div>
  );
}

function Line({ className = "" }: { className?: string }) {
  return <span className={`route-loading__line ${className}`} />;
}

function ProductCardSkeleton() {
  return (
    <article className="route-loading__product">
      <div className="route-loading__image" />
      <Line className="route-loading__product-title" />
      <Line className="route-loading__product-copy" />
    </article>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="route-loading__products">
      {[0, 1, 2, 3].map((item) => <ProductCardSkeleton key={item} />)}
    </div>
  );
}

function CatalogControlsSkeleton() {
  return (
    <div className="route-loading__controls">
      <Line className="route-loading__control route-loading__control--search" />
      <Line className="route-loading__control" />
      <Line className="route-loading__control" />
      <Line className="route-loading__control route-loading__control--button" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <LoadingRegion label="Cargando inicio" className="route-loading--home">
      <div className="route-loading__home-hero">
        <div className="route-loading__home-copy">
          <Line className="route-loading__eyebrow" />
          <Line className="route-loading__home-title" />
          <Line className="route-loading__home-title route-loading__home-title--short" />
          <Line className="route-loading__home-button" />
        </div>
      </div>
      <div className="route-loading__home-featured">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__section-title" />
        <ProductGridSkeleton />
      </div>
    </LoadingRegion>
  );
}

export function CatalogSkeleton({ search = false }: { search?: boolean }) {
  return (
    <LoadingRegion
      label={search ? "Cargando resultados de búsqueda" : "Cargando catálogo"}
      className="route-loading--catalog"
    >
      <header className="route-loading__page-heading">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__heading" />
        <Line className="route-loading__description" />
      </header>
      <CatalogControlsSkeleton />
      <ProductGridSkeleton />
    </LoadingRegion>
  );
}

export function CollectionSkeleton() {
  return (
    <LoadingRegion label="Cargando colección" className="route-loading--collection">
      <header className="route-loading__collection-banner">
        <div className="route-loading__collection-copy">
          <Line className="route-loading__eyebrow" />
          <Line className="route-loading__heading" />
          <Line className="route-loading__description" />
          <Line className="route-loading__description route-loading__description--short" />
        </div>
        <div className="route-loading__collection-image" />
      </header>
      <CatalogControlsSkeleton />
      <ProductGridSkeleton />
    </LoadingRegion>
  );
}

export function ProductSkeleton() {
  return (
    <LoadingRegion label="Cargando ficha del producto" className="route-loading--product">
      <div className="route-loading__product-layout">
        <div className="route-loading__gallery">
          <div className="route-loading__image route-loading__image--main" />
          <div className="route-loading__gallery-thumbs">
            <div className="route-loading__image" />
            <div className="route-loading__image" />
          </div>
        </div>
        <div className="route-loading__product-info">
          <Line className="route-loading__eyebrow" />
          <Line className="route-loading__heading" />
          <Line className="route-loading__price" />
          <div className="route-loading__tags">
            <Line /><Line /><Line />
          </div>
          <Line className="route-loading__description" />
          <Line className="route-loading__description" />
          <Line className="route-loading__description route-loading__description--short" />
          <Line className="route-loading__button" />
        </div>
      </div>
    </LoadingRegion>
  );
}

export function FavoritesSkeleton() {
  return (
    <LoadingRegion label="Cargando favoritos" className="route-loading--favorites">
      <header className="route-loading__page-heading">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__heading" />
      </header>
      <ProductGridSkeleton />
    </LoadingRegion>
  );
}

export function CartSkeleton() {
  return (
    <LoadingRegion label="Cargando bolsa de compras" className="route-loading--cart">
      <header className="route-loading__page-heading">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__heading" />
      </header>
      <div className="route-loading__cart-row">
        <div className="route-loading__image" />
        <div><Line /><Line className="route-loading__description" /></div>
        <Line className="route-loading__price" />
      </div>
      <div className="route-loading__cart-row">
        <div className="route-loading__image" />
        <div><Line /><Line className="route-loading__description" /></div>
        <Line className="route-loading__price" />
      </div>
    </LoadingRegion>
  );
}

export function EditorialSkeleton({ label = "Cargando página" }: { label?: string }) {
  return (
    <LoadingRegion label={label} className="route-loading--editorial">
      <header className="route-loading__page-heading">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__heading" />
      </header>
      <div className="route-loading__editorial-copy">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Line key={item} className={item % 3 === 2 ? "route-loading__description route-loading__description--short" : "route-loading__description"} />
        ))}
      </div>
    </LoadingRegion>
  );
}

export function AccountSkeleton() {
  return (
    <LoadingRegion label="Cargando cuenta" className="route-loading--account">
      <header className="route-loading__page-heading">
        <Line className="route-loading__eyebrow" />
        <Line className="route-loading__heading" />
        <Line className="route-loading__description" />
      </header>
      <Line className="route-loading__button" />
    </LoadingRegion>
  );
}
