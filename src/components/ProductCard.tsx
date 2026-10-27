import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/commerce/models";
import { formatMoney, lowestPrice } from "@/commerce/catalog";
import { FavoriteToggle } from "./FavoriteToggle";
export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];
  return (
    <article className="product-card">
      <div className="product-image">
        <FavoriteToggle slug={product.slug} name={product.name} />
        <Link
          href={`/productos/${product.slug}`}
          aria-label={`Ver ${product.name}`}
        >
          <Image
            src={image?.url ?? "/assets/product.webp"}
            alt={image?.alt ?? product.name}
            width={image?.width ?? 1000}
            height={image?.height ?? 1000}
            sizes="(max-width: 767px) 46vw, 30vw"
          />
        </Link>
      </div>
      <div className="product-description">
        <div>
          <Link className="product-title" href={`/productos/${product.slug}`}>
            {product.name}
          </Link>
          <p>
            {product.variants.some((v) => v.available)
              ? product.category === "aros"
                ? "Aros de perfil orgánico"
                : "Collar contemporáneo"
              : "Sin disponibilidad"}
          </p>
        </div>
        <span className="product-price">
          {formatMoney(lowestPrice(product))}
        </span>
      </div>
    </article>
  );
}
