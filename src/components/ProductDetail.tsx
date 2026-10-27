"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import type { Product } from "@/commerce/models";
import { formatMoney } from "@/commerce/catalog";
import { useCart } from "./CartProvider";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
export function ProductDetail({ product }: { product: Product }) {
  const [selected, setSelected] = useState(
    product.variants.find((v) => v.available)?.id ?? product.variants[0].id,
  );
  const [added, setAdded] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [zoomControlsOpen, setZoomControlsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const { busy, error, mutate, openCart } = useCart();
  const variant = product.variants.find((v) => v.id === selected)!;
  const viewerImage =
    viewerIndex === null ? null : product.images[viewerIndex] ?? null;
  function moveViewer(direction: -1 | 1) {
    resetZoom();
    setViewerIndex((current) => {
      if (current === null || product.images.length < 2) return current;
      return (
        (current + direction + product.images.length) % product.images.length
      );
    });
  }
  function resetZoom() {
    setZoomControlsOpen(false);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }
  function closeViewer() {
    setViewerIndex(null);
    resetZoom();
  }
  function openViewer(index: number) {
    resetZoom();
    setViewerIndex(index);
  }
  function adjustZoom(direction: -1 | 1) {
    const next = Math.min(2.5, Math.max(1, zoomLevel + direction * 0.5));
    setZoomLevel(next);
    if (next === 1) setPan({ x: 0, y: 0 });
  }
  function moveZoom(direction: "left" | "right" | "up" | "down") {
    if (zoomLevel === 1) return;
    setPan((current) => {
      const amount = 12;
      const limit = Math.min(40, (zoomLevel - 1) * 32);
      const next = {
        x: current.x + (direction === "left" ? amount : direction === "right" ? -amount : 0),
        y: current.y + (direction === "up" ? amount : direction === "down" ? -amount : 0),
      };
      return {
        x: Math.max(-limit, Math.min(limit, next.x)),
        y: Math.max(-limit, Math.min(limit, next.y)),
      };
    });
  }
  function handleViewerKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveViewer(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveViewer(1);
    }
  }
  async function add() {
    const opener = document.activeElement as HTMLElement;
    const ok = await mutate({
      type: "add",
      variantId: variant.id,
      quantity: 1,
    });
    if (ok) {
      setAdded(true);
      openCart(opener);
    }
  }
  return (
    <section className="detail">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link href="/catalogo">Colección</Link> /{" "}
        <Link
          href={`/colecciones/${product.collectionSlugs[0] ?? product.category}`}
        >
          {product.category}
        </Link>{" "}
        / <span aria-current="page">{product.name}</span>
      </nav>
      <div className="detail-layout">
        <div
          className="product-gallery"
          aria-label={`Galería de imágenes de ${product.name}`}
        >
          {product.images.length > 0 ? (
            product.images.map((item, index) => (
              <figure className="gallery-frame" key={`${item.url}-${index}`}>
                <button
                  type="button"
                  className="gallery-image-trigger"
                  aria-label={`Ampliar fotografía ${index + 1} de ${product.images.length}: ${item.alt}`}
                  onClick={() => openViewer(index)}
                >
                  <Image
                    className="gallery-image"
                    src={item.url}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width:767px) 100vw, 56vw"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </button>
              </figure>
            ))
          ) : (
            <div className="empty-state">Fotografía pendiente</div>
          )}
        </div>
        <div className="detail-content">
          <p className="eyebrow">{product.category} / EULÁN</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatMoney(variant.price)}</p>
          <p className="lead">{product.description}</p>
          <fieldset className="variant-picker">
            <legend>Acabado</legend>
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={selected === v.id}
                onClick={() => {
                  setSelected(v.id);
                  setAdded(false);
                }}
              >
                {v.name}
                {!v.available ? " · Agotado" : ""}
              </button>
            ))}
          </fieldset>
          <p className="availability">
            {variant.available
              ? "Disponible" + (product.demo ? " en demostración" : "")
              : "Sin disponibilidad"}
          </p>
          <button
            className="button btn full"
            onClick={() => void add()}
            disabled={busy || !variant.available}
          >
            {busy
              ? "Agregando…"
              : !variant.available
                ? "Agotado"
                : "Añadir al carrito"}
          </button>
          <p role="status" className="demo-note">
            {added ? "Pieza añadida a tu carrito." : ""}
          </p>
          {error && (
            <p className="feedback" role="alert">
              {error}
            </p>
          )}
          {product.demo && (
            <p className="concept-note">
              Pieza, precio y variantes conceptuales. No se generan pedidos,
              pagos ni reservas.
            </p>
          )}
          <details open>
            <summary>Materiales y características</summary>
            <p>{product.materials}</p>
          </details>
          <details>
            <summary>Cuidados de tu pieza</summary>
            <p>{product.care}</p>
            <Link className="underlined" href="/cuidados">
              Leer la guía
            </Link>
          </details>
          <details>
            <summary>Envíos y devoluciones</summary>
            <p>Consulta la información vigente antes de comprar.</p>
            <Link className="underlined" href="/envios">
              Envíos
            </Link>
            <br />
            <Link className="underlined" href="/cambios-y-devoluciones">
              Cambios y devoluciones
            </Link>
          </details>
        </div>
      </div>
      <Modal
        open={viewerIndex !== null}
        onClose={closeViewer}
        title={`Galería de ${product.name}`}
        className="gallery-modal"
        onKeyDown={handleViewerKeyDown}
      >
        {viewerImage && viewerIndex !== null && (
          <div className="gallery-viewer">
            {product.images.length > 1 && (
              <button
                className="gallery-viewer-control gallery-viewer-control--previous"
                type="button"
                aria-label="Fotografía anterior"
                onClick={() => moveViewer(-1)}
              >
                <Icon name="arrow-left" />
              </button>
            )}
            <div
              className={`gallery-viewer-stage${zoomLevel > 1 ? " is-zoomed" : ""}`}
              aria-live="polite"
            >
              <Image
                className="gallery-viewer-image"
                src={viewerImage.url}
                alt={viewerImage.alt}
                fill
                sizes="100vw"
                loading="eager"
                style={{
                  transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoomLevel})`,
                }}
              />
            </div>
            {product.images.length > 1 && (
              <button
                className="gallery-viewer-control gallery-viewer-control--next"
                type="button"
                aria-label="Fotografía siguiente"
                onClick={() => moveViewer(1)}
              >
                <Icon name="arrow-right" />
              </button>
            )}
            <p className="gallery-viewer-count" aria-live="polite">
              {viewerIndex + 1} / {product.images.length}
            </p>
            <div className="gallery-viewer-zoom">
              <button
                className="gallery-viewer-control gallery-viewer-zoom-toggle"
                type="button"
                aria-label={zoomControlsOpen ? "Cerrar controles de zoom" : "Abrir controles de zoom"}
                aria-expanded={zoomControlsOpen}
                onClick={() => setZoomControlsOpen((open) => !open)}
              >
                <Icon name={zoomLevel > 1 ? "zoom-out" : "zoom-in"} />
              </button>
              {zoomControlsOpen && (
                <div className="gallery-viewer-zoom-panel" aria-label="Controles de zoom">
                  <button
                    className="gallery-viewer-control"
                    type="button"
                    aria-label="Reducir imagen"
                    disabled={zoomLevel <= 1}
                    onClick={() => adjustZoom(-1)}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <button
                    className="gallery-viewer-control"
                    type="button"
                    aria-label="Ampliar imagen"
                    disabled={zoomLevel >= 2.5}
                    onClick={() => adjustZoom(1)}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                  <div className="gallery-viewer-pan" aria-label="Mover imagen ampliada">
                    <button className="gallery-viewer-pan--up" type="button" aria-label="Mover imagen arriba" disabled={zoomLevel === 1} onClick={() => moveZoom("up")}>
                      <Icon name="arrow-right" />
                    </button>
                    <button className="gallery-viewer-pan--left" type="button" aria-label="Mover imagen izquierda" disabled={zoomLevel === 1} onClick={() => moveZoom("left")}>
                      <Icon name="arrow-left" />
                    </button>
                    <button className="gallery-viewer-pan--right" type="button" aria-label="Mover imagen derecha" disabled={zoomLevel === 1} onClick={() => moveZoom("right")}>
                      <Icon name="arrow-right" />
                    </button>
                    <button className="gallery-viewer-pan--down" type="button" aria-label="Mover imagen abajo" disabled={zoomLevel === 1} onClick={() => moveZoom("down")}>
                      <Icon name="arrow-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
