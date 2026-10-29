"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/commerce/models";
import { formatMoney, lowestPrice } from "@/commerce/catalog";
import { Icon } from "./Icon";
import { FavoriteToggle } from "./FavoriteToggle";

const referencePricing: Record<string, [number, string, string]> = {
  "aro-volumen": [34990, "−29%", "aro-volumen"],
  "aro-lagrima": [31990, "−28%", "aro-lagrima"],
  "collar-eslabon": [49990, "−20%", "collar-eslabon"],
  "aro-colgante": [26990, "−26%", "aro-huggie"],
  "collar-gota": [42990, "−24%", "collar-medalla"],
};

export function FeaturedProducts({
  products,
  title = "Explora los favoritos de nuestro catálogo",
  ariaLabel = "Productos destacados",
  trackId = "featured-track",
}: {
  products: Product[];
  title?: string;
  ariaLabel?: string;
  trackId?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canMovePrevious, setCanMovePrevious] = useState(false);
  const [canMoveNext, setCanMoveNext] = useState(products.length > 1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      setCanMovePrevious(track.scrollLeft > 2);
      setCanMoveNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 2);
    };

    const handleKeys = (event: KeyboardEvent) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    };

    const move = (direction: number) => {
      const firstSlide = track.firstElementChild as HTMLElement | null;
      const width = firstSlide?.getBoundingClientRect().width ?? 320;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      track.scrollBy({
        left: direction * (width + gap),
        behavior: reducedMotion ? "instant" : "smooth",
      });
    };

    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", handleKeys);
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(track);
    update();

    return () => {
      track.removeEventListener("scroll", update);
      track.removeEventListener("keydown", handleKeys);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [products.length]);

  const move = (direction: number) => {
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = track.firstElementChild as HTMLElement | null;
    const width = firstSlide?.getBoundingClientRect().width ?? 320;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollBy({
      left: direction * (width + gap),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <section
      className={`featured-products${trackId === "featured-track" ? "" : " featured-products--related"}`}
      aria-label={ariaLabel}
      aria-roledescription="carrusel"
    >
      <div className="featured-header">
        <h2>{title}</h2>
      </div>
      <div className="featured-carousel-shell">
        <div
          className="featured-carousel-controls"
          role="group"
          aria-label="Controles del carrusel de productos"
        >
          {canMovePrevious && (
            <button
              className="featured-carousel-arrow featured-carousel-arrow--previous"
              type="button"
              onClick={() => move(-1)}
              aria-label="Ver productos anteriores"
              aria-controls={trackId}
            >
              <Icon name="arrow-left" />
            </button>
          )}
          {canMoveNext && (
            <button
              className="featured-carousel-arrow featured-carousel-arrow--next"
              type="button"
              onClick={() => move(1)}
              aria-label="Ver productos siguientes"
              aria-controls={trackId}
            >
              <Icon name="arrow-right" />
            </button>
          )}
        </div>
        <div
          className="featured-track carousel carousel-horizontal"
          id={trackId}
          ref={trackRef}
          tabIndex={0}
          aria-label={`${title}. Desliza en móvil o usa las flechas del teclado y los botones para recorrerlos`}
        >
          {products.map((product, index) => {
            const photo = product.images[0];
            const demo = product.demo
              ? referencePricing[product.slug]
              : undefined;
            return (
              <article
                key={product.id}
                className={`featured-slide carousel-item featured-slide--${demo?.[2] ?? product.slug}`}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${products.length}`}
              >
                <Link
                  className="featured-product-link"
                  href={`/productos/${product.slug}`}
                  aria-label={`${product.name}, ${product.demo ? "precio de referencia " : ""}${formatMoney(lowestPrice(product))}`}
                >
                  <span className="featured-product-image">
                    <Image
                      className="panel-jewel"
                      src={photo?.url ?? "/assets/product.webp"}
                      alt={photo?.alt ?? product.name}
                      width={1254}
                      height={1254}
                      sizes="(max-width:767px) 85vw, 45vw"
                    />
                    {product.demo && (
                      <span
                        className="featured-badges"
                        aria-label="Características de referencia"
                      >
                        <span>316L</span>
                        <span>PVD 18K</span>
                        <span>Waterproof</span>
                      </span>
                    )}
                  </span>
                  <span className="featured-product-info">
                    <span className="featured-product-heading">
                      <span className="featured-product-name">
                        {product.name}
                      </span>
                      <span className="featured-open" aria-hidden="true">
                        <Icon name="arrow" />
                      </span>
                    </span>
                    <span className="featured-pricing">
                      <span className="featured-current-price">
                        {formatMoney(lowestPrice(product))}
                      </span>
                      {demo && (
                        <>
                          <s className="featured-previous-price">
                            {formatMoney({ amount: demo[0], currency: "CLP" })}
                          </s>
                          <span className="featured-discount">
                            {demo[1]}
                          </span>
                        </>
                      )}
                    </span>
                  </span>
                </Link>
                <FavoriteToggle slug={product.slug} name={product.name} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
