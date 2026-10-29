import Link from "next/link";
import { commerce } from "@/commerce/provider";
import { ProductCard } from "./ProductCard";
import { RouteReady } from "./RouteReady";
import type { CatalogQuery } from "@/commerce/models";
export type SearchParams = Record<string, string | string[] | undefined>;
const value = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : undefined;
export async function Catalog({
  searchParams,
  collection,
  search = false,
}: {
  searchParams: SearchParams;
  collection?: string;
  search?: boolean;
}) {
  const provider = commerce();
  const all = await provider.getProducts(collection ? { collection } : {});
  const query: CatalogQuery = {
    collection,
    category: value(searchParams.categoria),
    query: value(searchParams.q),
    finish: value(searchParams.acabado),
    available: value(searchParams.disponible) === "1",
    sort: value(searchParams.orden),
  };
  const { filterProducts } = await import("@/commerce/catalog");
  const products = filterProducts(all, query);
  const categories = [...new Set(all.map((p) => p.category))].filter(Boolean);
  const finishes = [
    ...new Set(all.flatMap((p) => p.variants.map((v) => v.options.Acabado))),
  ].filter(Boolean);
  return (
    <>
      <form
        className="catalog-toolbar"
        method="get"
        role="search"
        aria-label={search ? "Buscar productos" : "Filtrar catálogo"}
      >
        <label className="field">
          {search ? "Buscar una pieza" : "Nombre o descripción"}
          <input
            type="search"
            name="q"
            defaultValue={query.query}
            placeholder="Por ejemplo, gota"
            maxLength={120}
          />
        </label>
        {!collection && (
          <label className="field">
            Categoría
            <select name="categoria" defaultValue={query.category ?? ""}>
              <option value="">Todas las piezas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
        )}
        {finishes.length > 0 && (
          <label className="field">
            Acabado
            <select name="acabado" defaultValue={query.finish ?? ""}>
              <option value="">Todos</option>
              {finishes.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field">
          Ordenar por
          <select name="orden" defaultValue={query.sort ?? ""}>
            <option value="">Selección EULÁN</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="nombre">Nombre</option>
          </select>
        </label>
        <label className="field-check">
          <input
            type="checkbox"
            name="disponible"
            value="1"
            defaultChecked={query.available}
          />
          Solo disponibles
        </label>
        <button className="button btn" type="submit">
          {search ? "Buscar" : "Aplicar"}
        </button>
        <Link
          className="underlined"
          href={
            collection
              ? `/colecciones/${collection}`
              : search
                ? "/buscar"
                : "/catalogo"
          }
        >
          Limpiar
        </Link>
        <span className="toolbar-count" role="status">
          {products.length} {products.length === 1 ? "pieza" : "piezas"}
        </span>
      </form>
      {products.length ? (
        <section
          aria-label="Productos"
          className="product-grid catalog-grid store-grid"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </section>
      ) : (
        <section className="empty-catalog">
          <h2>No encontramos piezas con esos filtros.</h2>
          <p>Prueba con otro nombre o vuelve a explorar la colección.</p>
          <Link className="underlined" href="/catalogo">
            Ver todas las piezas
          </Link>
        </section>
      )}
      <RouteReady />
    </>
  );
}
