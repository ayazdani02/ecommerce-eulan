"use client";
import Image from "next/image";
import Link from "next/link";
import {
  useRef,
  useState,
  useEffect,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type UIEvent,
} from "react";
import type { CartLine, Product } from "@/commerce/models";
import { formatMoney } from "@/commerce/catalog";
import { useCart } from "./CartProvider";
import { Modal } from "./Modal";
import { Icon } from "./Icon";
import { DeliveryEstimator } from "./DeliveryEstimator";
import { FavoriteToggle } from "./FavoriteToggle";
type MaterialIconName =
  | "steel"
  | "gold"
  | "coating"
  | "waterproof"
  | "hypoallergenic"
  | "material";
function materialIconFor(value: string): MaterialIconName {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(waterproof|impermeable|water resistant)\b/.test(normalized))
    return "waterproof";
  if (/\b(hipoalergenico|hypoallergenic)\b/.test(normalized))
    return "hypoallergenic";
  if (/\b(pvd|bano|recubrimiento)\b/.test(normalized)) return "coating";
  if (/\b(oro|gold|enchapado|enchapada)\b/.test(normalized)) return "gold";
  if (/\b(acero|inoxidable|stainless)\b/.test(normalized)) return "steel";
  return "material";
}
function ProductPurchaseLabel({
  busy,
  available,
}: {
  busy: boolean;
  available: boolean;
}) {
  if (busy) return <>Agregando…</>;
  if (!available) return <>Agotado</>;

  return (
    <span className="product-cta-content">
      <Icon name="cart" />
      <span>Añadir a la Bolsa</span>
    </span>
  );
}
function ProductInBagControl({
  line,
  busy,
  onQuantityChange,
  className = "",
}: {
  line: CartLine;
  busy: boolean;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}) {
  const maxQuantity = Math.min(line.variant.stock ?? 99, 99);

  return (
    <div
      className={`product-in-bag-control ${className}`.trim()}
      role="group"
      aria-label={`Cantidad de ${line.product.name} en la bolsa`}
      aria-busy={busy}
    >
      <span className="product-in-bag-label" role="status">
        <Icon name="cart" />
        <span>En la bolsa</span>
      </span>
      <div className="product-in-bag-stepper">
        <button
          type="button"
          aria-label={`Quitar una unidad de ${line.product.name}`}
          disabled={busy}
          onClick={() => onQuantityChange(line.quantity - 1)}
        >
          −
        </button>
        <output aria-label={`Cantidad en la bolsa: ${line.quantity}`} aria-live="polite">
          {line.quantity}
        </output>
        <button
          type="button"
          aria-label={`Agregar una unidad de ${line.product.name}`}
          disabled={busy || line.quantity >= maxQuantity}
          onClick={() => onQuantityChange(line.quantity + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
export function ProductDetail({ product }: { product: Product }) {
  const categoryLabel = product.category
    ? product.category.toLocaleUpperCase("es")
    : product.category;
  const [selected, setSelected] = useState(
    product.variants.find((v) => v.available)?.id ?? product.variants[0].id,
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryViewportRef = useRef<HTMLDivElement>(null);
  const addToCartButtonRef = useRef<HTMLDivElement>(null);
  const mobileProductCtaButtonRef = useRef<HTMLElement>(null);
  const lastScrollYRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef<"down" | "up" | null>(null);
  const viewerTouchStart = useRef<{
    zoom: number;
    pinchDistance?: number;
  } | null>(null);
  const viewerPointerStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    panX: number;
    panY: number;
    zoom: number;
  } | null>(null);
  const pinchGesture = useRef(false);
  const blockViewerClick = useRef(false);
  const [zoomControlsOpen, setZoomControlsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showMobileFloatingCta, setShowMobileFloatingCta] = useState(true);
  const { cart, busy, error, mutate } = useCart();
  const variant = product.variants.find((v) => v.id === selected)!;
  const cartLine = cart?.lines.find((line) => line.variant.id === variant.id);
  const variantOptionNames = [
    ...new Set(product.variants.flatMap((item) => Object.keys(item.options))),
  ];
  const discountPercent = variant.compareAtPrice && variant.compareAtPrice.amount > variant.price.amount
    ? Math.round((1 - variant.price.amount / variant.compareAtPrice.amount) * 100)
    : 0;
  const viewerImage =
    viewerIndex === null ? null : product.images[viewerIndex] ?? null;
  useEffect(() => {
    const button = addToCartButtonRef.current;
    if (!button) return;

    let frame: number | null = null;
    const updateVisibility = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const scrollY = window.scrollY;
        if (lastScrollYRef.current !== null && scrollY !== lastScrollYRef.current) {
          scrollDirectionRef.current = scrollY > lastScrollYRef.current ? "down" : "up";
        }
        lastScrollYRef.current = scrollY;

        const buttonRect = button.getBoundingClientRect();
        const hasPassedButton = buttonRect.bottom <= 0;
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const stickyBarBottom = isMobile ? 64 : 80;
        const shouldShowStickyBar = scrollDirectionRef.current === "up"
          ? buttonRect.top < stickyBarBottom
          : hasPassedButton;
        setShowStickyBar(shouldShowStickyBar);

        const floatingCtaRect = mobileProductCtaButtonRef.current?.getBoundingClientRect();
        const floatingCtaBottom = floatingCtaRect?.bottom ?? window.innerHeight;
        const shouldShowFloatingCta = buttonRect.top >= 0
          && buttonRect.bottom > floatingCtaBottom;
        setShowMobileFloatingCta(
          isMobile && !shouldShowStickyBar && shouldShowFloatingCta,
        );
      });
    };
    const observer = new IntersectionObserver(updateVisibility, { threshold: 0 });
    observer.observe(button);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    updateVisibility();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);
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
  function handleGalleryScroll(event: UIEvent<HTMLDivElement>) {
    const viewport = event.currentTarget;
    const nextIndex = Math.round(
      viewport.scrollLeft / Math.max(viewport.clientWidth, 1),
    );
    setGalleryIndex((current) => current === nextIndex ? current : nextIndex);
  }
  function goToGallery(index: number) {
    const viewport = galleryViewportRef.current;
    if (!viewport) return;
    const nextIndex = Math.max(0, Math.min(product.images.length - 1, index));
    viewport.scrollTo({
      left: nextIndex * viewport.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    setGalleryIndex(nextIndex);
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
  function zoomViewerFromImage() {
    if (blockViewerClick.current) {
      blockViewerClick.current = false;
      return;
    }
    setZoomControlsOpen(true);
    if (zoomLevel >= 2.5) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoomLevel(zoomLevel === 1 ? 1.75 : 2.5);
    }
  }
  function handleViewerTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) return;
    const first = event.touches[0];
    const second = event.touches[1];
    if (!first || !second) return;
    pinchGesture.current = true;
    viewerTouchStart.current = {
      zoom: zoomLevel,
      pinchDistance: Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      ),
    };
  }
  function handleViewerTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const start = viewerTouchStart.current;
    const first = event.touches[0];
    const second = event.touches[1];
    if (!start || !first || !second || !start.pinchDistance) return;
    {
      const distance = Math.hypot(
        second.clientX - first.clientX,
        second.clientY - first.clientY,
      );
      const nextZoom = Math.max(
        1,
        Math.min(2.5, start.zoom * (distance / start.pinchDistance)),
      );
      blockViewerClick.current = true;
      setZoomLevel(nextZoom);
      setZoomControlsOpen(true);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
    }
  }
  function handleViewerTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length > 0) {
      viewerTouchStart.current = null;
      return;
    }
    const wasPinching = pinchGesture.current;
    pinchGesture.current = false;
    viewerTouchStart.current = null;
    if (wasPinching) {
      blockViewerClick.current = true;
      window.setTimeout(() => {
        blockViewerClick.current = false;
      }, 350);
    }
  }
  function handleViewerTouchCancel() {
    viewerTouchStart.current = null;
    pinchGesture.current = false;
    window.setTimeout(() => {
      blockViewerClick.current = false;
    }, 350);
  }
  function handleViewerPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || pinchGesture.current) return;
    viewerPointerStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      zoom: zoomLevel,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function handleViewerPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = viewerPointerStart.current;
    if (
      !start ||
      start.pointerId !== event.pointerId ||
      start.zoom <= 1 ||
      pinchGesture.current
    ) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
    event.currentTarget.parentElement?.classList.add("is-panning");
    blockViewerClick.current = true;
    const limit = Math.min(40, (start.zoom - 1) * 32);
    setPan({
      x: Math.max(-limit, Math.min(limit, start.panX + (deltaX / event.currentTarget.clientWidth) * 100)),
      y: Math.max(-limit, Math.min(limit, start.panY + (deltaY / event.currentTarget.clientHeight) * 100)),
    });
  }
  function handleViewerPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = viewerPointerStart.current;
    viewerPointerStart.current = null;
    event.currentTarget.parentElement?.classList.remove("is-panning");
    if (!start || start.pointerId !== event.pointerId || pinchGesture.current) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (start.zoom > 1) {
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        blockViewerClick.current = true;
        window.setTimeout(() => {
          blockViewerClick.current = false;
        }, 350);
      }
      return;
    }
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    blockViewerClick.current = true;
    moveViewer(deltaX < 0 ? 1 : -1);
    window.setTimeout(() => {
      blockViewerClick.current = false;
    }, 350);
  }
  function handleViewerPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    viewerPointerStart.current = null;
    event.currentTarget.parentElement?.classList.remove("is-panning");
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
    await mutate({
      type: "add",
      variantId: variant.id,
      quantity: 1,
    });
  }
  function changeQuantity(line: CartLine, quantity: number) {
    void mutate(
      quantity <= 0
        ? { type: "remove", lineId: line.id }
        : { type: "update", lineId: line.id, quantity },
    );
  }
  return (
    <section className="detail">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <Link
          href={`/colecciones/${product.collectionSlugs[0] ?? product.category}`}
        >
          {categoryLabel}
        </Link>{" "}
        / <span aria-current="page">{product.name}</span>
      </nav>
      <div className="detail-layout">
        <div
          className="product-gallery"
          role="region"
          aria-label={`Galería de imágenes de ${product.name}`}
          aria-roledescription="carrusel"
        >
          <div
            className="product-gallery-viewport"
            ref={galleryViewportRef}
            onScroll={handleGalleryScroll}
          >
            {product.images.length > 0 ? (
              product.images.map((item, index) => (
                <figure
                  className="gallery-frame"
                  key={`${item.url}-${index}`}
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${index + 1} de ${product.images.length}`}
                >
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
          {product.images.length > 1 && (
            <div
              className="gallery-mobile-pagination"
              role="group"
              aria-label={`Fotografía ${galleryIndex + 1} de ${product.images.length}`}
            >
              {product.images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  className="gallery-pagination-dot"
                  aria-label={`Ver fotografía ${index + 1} de ${product.images.length}`}
                  aria-pressed={galleryIndex === index}
                  onClick={() => goToGallery(index)}
                >
                  <span aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-content">
          <p
            className={`availability ${variant.available ? "is-available" : "is-unavailable"}`}
            role="status"
          >
            <span className="availability-dot" aria-hidden="true" />
            {variant.available
              ? "Disponible" + (product.demo ? " en demostración" : "")
              : "Sin disponibilidad"}
          </p>
          <div className="detail-product-heading">
            <div className="detail-product-heading-copy">
              {variant.sku && <p className="detail-sku">{variant.sku}</p>}
              <div className="detail-title-row">
                <h1>{product.name}</h1>
                {discountPercent > 0 && (
                  <span className="detail-discount-badge">{discountPercent}% OFF</span>
                )}
              </div>
            </div>
            <FavoriteToggle slug={product.slug} name={product.name} />
          </div>
          <p className="detail-price">
            {discountPercent > 0 && (
              <del aria-label={`Precio anterior: ${formatMoney(variant.compareAtPrice!)}`}>
                {formatMoney(variant.compareAtPrice!)}
              </del>
            )}
            <span className="detail-current-price">{formatMoney(variant.price)}</span>
          </p>
          {product.materials.length > 0 && (
            <ul className="product-attribute-list" aria-label="Características del producto">
              {product.materials.map((material) => {
                const icon = materialIconFor(material);
                return (
                  <li key={material}>
                    <span
                      className={`material-attribute-icon material-attribute-icon--${icon}`}
                      aria-hidden="true"
                    >
                      <Icon name={icon} />
                    </span>
                    <span>{material}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="lead">{product.description}</p>
          {product.variants.length > 1 && (
            <fieldset className="variant-picker">
              {variantOptionNames.length > 0 && (
                <legend>{variantOptionNames.join(" / ")}</legend>
              )}
              {product.variants.map((item) => {
                const values = variantOptionNames
                  .map((name) => item.options[name])
                  .filter(Boolean);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected === item.id}
                    onClick={() => {
                      setSelected(item.id);
                    }}
                  >
                    {values.length > 0 ? values.join(" / ") : item.name}
                    {!item.available ? " · Agotado" : ""}
                  </button>
                );
              })}
            </fieldset>
          )}
          <DeliveryEstimator />
          <div
            ref={addToCartButtonRef}
            className={`product-detail-purchase-anchor${showStickyBar || showMobileFloatingCta ? " is-covered" : ""}`}
            aria-hidden={showStickyBar || showMobileFloatingCta}
          >
            {cartLine ? (
              <ProductInBagControl
                line={cartLine}
                busy={busy}
                onQuantityChange={(quantity) => changeQuantity(cartLine, quantity)}
              />
            ) : (
              <button
                className="button btn full product-detail-inline-cta"
                type="button"
                tabIndex={showStickyBar || showMobileFloatingCta ? -1 : undefined}
                onClick={() => void add()}
                disabled={busy || !variant.available}
              >
                <ProductPurchaseLabel busy={busy} available={variant.available} />
              </button>
            )}
          </div>
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
          {product.materialsDescription && (
            <details>
              <summary>Materiales y características</summary>
              <div className="materials-description">
                {product.materialsDescription
                  .split(/\n\s*\n/)
                  .map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 16)}`}>
                      {paragraph.trim()}
                    </p>
                  ))}
              </div>
            </details>
          )}
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
      {showStickyBar && (
        <aside className="sticky-product-bar" aria-label={`Compra rápida: ${product.name}`}>
          <div className="sticky-product-bar__inner">
            {product.images[0] && (
              <Image
                className="sticky-product-bar__image"
                src={product.images[0].url}
                alt=""
                width={product.images[0].width}
                height={product.images[0].height}
                sizes="64px"
              />
            )}
            <div className="sticky-product-bar__copy">
              <p className="sticky-product-bar__title">{product.name}</p>
              <p className="sticky-product-bar__price">{formatMoney(variant.price)}</p>
            </div>
            {cartLine ? (
              <ProductInBagControl
                line={cartLine}
                busy={busy}
                className="product-in-bag-control--sticky"
                onQuantityChange={(quantity) => changeQuantity(cartLine, quantity)}
              />
            ) : (
              <button
                className="sticky-product-bar__cta button btn"
                type="button"
                onClick={() => void add()}
                disabled={busy || !variant.available}
              >
                <ProductPurchaseLabel busy={busy} available={variant.available} />
              </button>
            )}
          </div>
        </aside>
      )}
      <aside
        ref={mobileProductCtaButtonRef}
        className={`mobile-product-cta${showMobileFloatingCta && !showStickyBar ? " is-visible" : ""}`}
        aria-hidden={!showMobileFloatingCta || showStickyBar}
        aria-label={`Compra rápida: ${product.name}`}
      >
        {cartLine ? (
          <ProductInBagControl
            line={cartLine}
            busy={busy}
            className="product-in-bag-control--floating"
            onQuantityChange={(quantity) => changeQuantity(cartLine, quantity)}
          />
        ) : (
          <button
            className="button btn full mobile-product-cta__button"
            type="button"
            onClick={() => void add()}
            disabled={busy || !variant.available}
          >
            <ProductPurchaseLabel busy={busy} available={variant.available} />
          </button>
        )}
      </aside>
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
              onTouchStart={handleViewerTouchStart}
              onTouchMove={handleViewerTouchMove}
              onTouchEnd={handleViewerTouchEnd}
              onTouchCancel={handleViewerTouchCancel}
            >
              <button
                className="gallery-viewer-image-trigger"
                type="button"
                aria-label={zoomLevel >= 2.5 ? "Restablecer fotografía" : "Acercar fotografía"}
                onClick={zoomViewerFromImage}
                onPointerDown={handleViewerPointerDown}
                onPointerMove={handleViewerPointerMove}
                onPointerUp={handleViewerPointerUp}
                onPointerCancel={handleViewerPointerCancel}
                onDragStart={(event) => event.preventDefault()}
              >
                <Image
                  className="gallery-viewer-image"
                  src={viewerImage.url}
                  alt={viewerImage.alt}
                  fill
                  draggable={false}
                  sizes="100vw"
                  loading="eager"
                  style={{
                    transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoomLevel})`,
                  }}
                />
              </button>
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
            <div className="gallery-viewer-zoom">
              {zoomControlsOpen ? (
                <div className="gallery-viewer-zoom-panel" role="group" aria-label="Controles de zoom">
                  <div className="gallery-viewer-pan" role="group" aria-label="Mover imagen ampliada">
                    <button className="gallery-viewer-pan--up" type="button" aria-label="Mover imagen arriba" disabled={zoomLevel === 1} onClick={() => moveZoom("up")}>
                      <Icon name="arrow-right" />
                    </button>
                    <button className="gallery-viewer-pan--left" type="button" aria-label="Mover imagen a la izquierda" disabled={zoomLevel === 1} onClick={() => moveZoom("left")}>
                      <Icon name="arrow-left" />
                    </button>
                    <button className="gallery-viewer-pan--right" type="button" aria-label="Mover imagen a la derecha" disabled={zoomLevel === 1} onClick={() => moveZoom("right")}>
                      <Icon name="arrow-right" />
                    </button>
                    <button className="gallery-viewer-pan--down" type="button" aria-label="Mover imagen abajo" disabled={zoomLevel === 1} onClick={() => moveZoom("down")}>
                      <Icon name="arrow-right" />
                    </button>
                  </div>
                  <div className="gallery-viewer-zoom-actions">
                  <button
                    className="gallery-viewer-control gallery-viewer-zoom-step"
                    type="button"
                    aria-label="Reducir imagen"
                    disabled={zoomLevel <= 1}
                    onClick={() => adjustZoom(-1)}
                  >
                    <Icon name="zoom-out" />
                  </button>
                  <button
                    className="gallery-viewer-control gallery-viewer-zoom-step"
                    type="button"
                    aria-label="Ampliar imagen"
                    disabled={zoomLevel >= 2.5}
                    onClick={() => adjustZoom(1)}
                  >
                    <Icon name="zoom-in" />
                  </button>
                  </div>
                  <button
                    className="gallery-viewer-zoom-close"
                    type="button"
                    aria-label="Cerrar controles de zoom"
                    onClick={() => setZoomControlsOpen(false)}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              ) : (
                <button
                  className="gallery-viewer-control gallery-viewer-zoom-toggle"
                  type="button"
                  aria-label="Abrir controles de zoom"
                  aria-expanded={false}
                  onClick={() => setZoomControlsOpen(true)}
                >
                  <Icon name="zoom-in" />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
