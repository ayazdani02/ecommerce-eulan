"use client";

import Link from "next/link";
import type { Product } from "@/commerce/models";
import { ProductCard } from "./ProductCard";
import { useFavorites } from "./FavoritesProvider";

export function FavoritesPage({ products }: { products: Product[] }) {
  const { slugs } = useFavorites();
  const favorites = products.filter((product) => slugs.includes(product.slug));
  return (
    <>
      <section className="page-intro favorites-intro">
        <p className="eyebrow">Tu selección / EULÁN</p>
        <h1>Favoritos.</h1>
        <p>Las piezas que guardaste para volver a ellas.</p>
      </section>
      {favorites.length ? (
        <section className="product-grid catalog-grid store-grid favorites-grid" aria-label="Tus favoritos">
          {favorites.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      ) : (
        <section className="favorites-empty">
          <p>Aún no guardas piezas.</p>
          <Link className="button" href="/catalogo">Explorar el catálogo</Link>
        </section>
      )}
    </>
  );
}
