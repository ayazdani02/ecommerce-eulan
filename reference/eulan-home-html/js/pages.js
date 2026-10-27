import { productCategories } from "./products.js";
import { productCard, featuredCarousel, categoryShortcuts, productAttributes } from "./components.js";

export function homePage(products, store) {
  return `
    <section class="hero immersive-hero hero-carousel" data-hero-carousel aria-label="Historias de eulán">
      <article class="hero-slide hero-slide--campaign is-active" data-hero-slide aria-hidden="false">
        <picture class="hero-picture">
          <img class="hero-img" src="assets/hero-desktop-blur.webp" alt="Modelo de eulán junto al mar, propuesta de imagen con fondo desenfocado" fetchpriority="high" width="1536" height="1024" />
        </picture>
        <div class="hero-copy">
          <h1>Waterproof.<br /> Todo el día.</h1>
          <ul class="hero-attributes" aria-label="Atributos de las joyas eulán">
            <li>
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 3.5S7.8 13 7.8 19.1a8.2 8.2 0 1 0 16.4 0C24.2 13 16 3.5 16 3.5Z"/><path d="M12.2 20.4a4.1 4.1 0 0 0 4.1 4.1"/></svg>
              <span><strong>Resistentes al agua</strong></span>
            </li>
            <li>
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 4 11 6-11 6-11-6 11-6Z"/><path d="m5 15 11 6 11-6M5 20l11 6 11-6"/></svg>
              <span><strong>Baño PVD oro 18K</strong></span>
            </li>
            <li>
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 3.5 27 7v8.2c0 6.6-4.4 11.1-11 14.3C10.4 26.3 6 21.8 6 15.2V7l10-3.5Z"/><path d="m11.5 15.8 3 3 6.2-6.5"/></svg>
              <span><strong>Acero inoxidable 316L</strong></span>
            </li>
            <li>
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M26.5 5.5C15.2 6.1 7 10.8 7 19.1c0 4.1 2.8 6.8 6.7 6.8 8.5 0 12.4-9.1 12.8-20.4Z"/><path d="M5 28c4.8-7 9.6-11.8 16-16.2"/></svg>
              <span><strong>Hipoalergénicas</strong></span>
            </li>
          </ul>
          <a class="button btn hero-collection-cta" href="#coleccion">Ver toda la colección <span aria-hidden="true">↗</span></a>
        </div>
      </article>
      <article class="hero-slide hero-slide--product" data-hero-slide aria-hidden="true" inert>
        <picture class="hero-product-picture">
          <source media="(max-width: 767px)" srcset="assets/hero-aros-mobile.webp" />
          <img class="hero-product-image" src="assets/hero-aros-v2.webp" alt="Aros dorados sobre una superficie cerámica marfil, propuesta conceptual de eulán" width="1774" height="887" />
        </picture>
        <div class="hero-copy hero-product-copy">
          <h2>Livianos.<br />Cómodos.</h2>
          <p class="hero-product-description">Aros diseñados para acompañarte con comodidad, de la mañana a la noche.</p>
          <a class="button btn" href="#coleccion/aros">Descubrir los aros <span aria-hidden="true">↗</span></a>
        </div>
      </article>
      <article class="hero-slide hero-slide--gift" data-hero-slide aria-hidden="true" inert>
        <picture class="hero-gift-picture">
          <img class="hero-gift-image" src="assets/hero-regalo.jpg" alt="Collar dorado sobre tela azul marino con orquídeas y detalles festivos" width="1536" height="1024" />
        </picture>
        <div class="hero-copy hero-gift-copy">
          <h2>El regalo perfecto</h2>
          <a class="button btn" href="#coleccion">Descubrir la colección <span aria-hidden="true">↗</span></a>
        </div>
      </article>
      <div class="hero-controls join join-horizontal" role="group" aria-label="Elegir escena del hero">
        <button type="button" class="hero-scene-option join-item btn" data-hero-scene="0" aria-label="Mostrar escena: Campaña" aria-pressed="true">
          <img class="hero-scene-thumbnail" src="assets/hero-desktop-blur.webp" alt="" width="48" height="48" />
          <span class="hero-scene-progress" aria-hidden="true"></span>
        </button>
        <button type="button" class="hero-scene-option join-item btn" data-hero-scene="1" aria-label="Mostrar escena: Detalle del producto" aria-pressed="false">
          <img class="hero-scene-thumbnail" src="assets/hero-aros-v2.webp" alt="" width="48" height="48" />
          <span class="hero-scene-progress" aria-hidden="true"></span>
        </button>
        <button type="button" class="hero-scene-option join-item btn" data-hero-scene="2" aria-label="Mostrar escena: El regalo perfecto" aria-pressed="false">
          <img class="hero-scene-thumbnail" src="assets/hero-regalo-thumb.jpg" alt="" width="48" height="48" />
          <span class="hero-scene-progress" aria-hidden="true"></span>
        </button>
      </div>
    </section>
    ${featuredCarousel()}
    ${categoryShortcuts()}
    ${productAttributes()}`;
}

export function collectionPage(products, store, active = "todos") {
  const filters = [["todos", "Todas las piezas"], ...productCategories.map(({ type, name }) => [type, name])];
  const items = products.filter((product) => active === "todos" || product.type === active);
  return `
    <section class="page-intro"><h1>La colección.</h1><p>Formas simples, distintas maneras de llevarlas. Explora las piezas de esta propuesta conceptual.</p></section>
    <div class="filter-bar" role="group" aria-label="Filtrar colección">
      ${filters.map(([key, label]) => `<button class="filter ${active === key ? "active" : ""}" data-filter="${key}" aria-pressed="${active === key}">${label}</button>`).join("")}
      <span class="filter-count" id="filter-count">${items.length} piezas</span>
    </div>
    <section class="product-grid catalog-grid" id="catalog-grid" aria-live="polite">${items.map((product) => productCard(product, store)).join("")}</section>`;
}

export function productPage(product, products, store) {
  if (!product) return `<section class="page-intro"><h1>Pieza no encontrada.</h1><p>Vuelve a la colección para descubrir las piezas disponibles en esta propuesta.</p><a class="underlined" href="#coleccion">Ver colección</a></section>`;
  const inCart = store.quantity(product.id) > 0;
  const related = products.filter((item) => item.id !== product.id);
  return `
    <section class="detail"><div class="breadcrumb"><a href="#coleccion">Colección</a> / ${product.name}</div>
      <div class="detail-layout"><img class="detail-image" src="${product.image}" alt="${product.name}, imagen conceptual" width="1000" height="1200" />
        <div class="detail-content"><h1>${product.name}</h1><p class="detail-sub">${product.kind}</p><p class="lead">${product.detail}</p>
          <div class="finish-row"><span class="finish-chip" aria-hidden="true"></span><span>Apariencia dorada</span></div>
          <button class="button btn full" data-add="${product.id}">${inCart ? "Ver en mi carrito" : "Añadir al carrito"}</button>
          <p class="concept-note">Pieza conceptual. Material, medidas, precio y disponibilidad por confirmar.</p>
          <details open><summary>El concepto</summary><p>Una exploración de joyería contemporánea para eulán. La imagen presenta una dirección visual; no representa una pieza disponible para compra.</p></details>
          <details><summary>Materiales y cuidados</summary><p>Se definirán con el producto real. La imagen no acredita ley, quilataje ni composición. Los cuidados se indicarán según su composición.</p></details>
          <details><summary>Presentación y disponibilidad</summary><p>El sistema de packaging está en desarrollo. El carrito no genera pedidos, pagos o reservas.</p></details>
        </div>
      </div>
    </section>
    ${related.length ? `<section class="collection-section"><div class="section-heading"><h2>Otra forma de mirarlo.</h2></div><div class="product-grid">${related.map((item) => productCard(item, store)).join("")}</div></section>` : ""}`;
}

export function universePage() {
  return `
    <section class="universe-lead reveal"><h1>Lo simple también tiene carácter.</h1><p>eulán es una marca chilena de joyería. Esta propuesta imagina su expresión digital desde la geometría, la cercanía y el cuidado del detalle.</p></section>
    <section class="editorial"><img src="assets/coast-square.webp" alt="Fotografía facilitada por eulán, retrato con aro rectangular dorado junto al mar" width="1200" height="1000" /><div class="editorial-copy"><h2>Menos ruido.<br />Más presencia.</h2><p>La firma, la imagen y las palabras comparten un mismo ritmo: claro, natural y personal.</p><a href="#coleccion" class="underlined">Ver colección</a></div></section>
    <section class="intro"><p class="small-label">Una mirada natural</p><p>La piel, el movimiento del pelo y el reflejo del metal. La imagen conserva el lugar y la luz de las fotografías de eulán.</p></section>
    <section class="territory-pair"><figure><img src="assets/coast-natural.webp" alt="Fotografía facilitada por la marca: retrato natural con aros dorados en la playa" loading="lazy" /><figcaption>Costa / piel, arena y reflejos. Fotografía de referencia de eulán.</figcaption></figure></section>
    <section class="service-notes"><div><h3>Claridad</h3><p>Información concreta para entender cada pieza.</p></div><div><h3>Cercanía</h3><p>Un lenguaje natural, que acompaña la elección.</p></div><div><h3>Coherencia</h3><p>Una misma identidad en pantalla y en cada aplicación.</p></div></section>`;
}
