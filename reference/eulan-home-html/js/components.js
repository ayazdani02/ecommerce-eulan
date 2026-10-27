import { productCategories } from "./products.js";

export function productCard(product, store) {
  const favorite = store.isFavorite(product.id);
  return `
    <article class="product-card reveal">
      <div class="product-image">
        <a href="#pieza/${product.id}" aria-label="Ver ${product.name}">
          <img src="${product.image}" alt="${product.name}, visual conceptual de joya dorada" loading="lazy" width="800" height="1000" />
        </a>
        <button class="favorite" data-favorite="${product.id}" aria-label="${favorite ? "Quitar de" : "Añadir a"} favoritos: ${product.name}" aria-pressed="${favorite}">
          <img src="assets/${favorite ? "heart-filled" : "heart"}.svg" width="20" height="20" alt="" />
        </button>
      </div>
      <div class="product-description">
        <div><a href="#pieza/${product.id}">${product.name}</a><p>${product.kind}</p></div>
        <a class="view-link" href="#pieza/${product.id}">Ver pieza</a>
      </div>
    </article>`;
}

export function featuredCarousel() {
  const highlights = [
    {
      id: "aro-volumen",
      name: "Aro Volumen",
      image: "assets/featured-aro-volumen-premium.jpg",
      alt: "Aros dorados de volumen en fotografía de estudio sobre fondo marfil claro",
      href: "#coleccion/aros",
      price: "$24.990",
      previousPrice: "$34.990",
      discount: "−29%",
    },
    {
      id: "aro-lagrima",
      name: "Aro Lágrima",
      image: "assets/featured-aro-lagrima-premium.jpg",
      alt: "Aros dorados alargados en fotografía de estudio sobre fondo marfil claro",
      href: "#coleccion/aros",
      price: "$22.990",
      previousPrice: "$31.990",
      discount: "−28%",
    },
    {
      id: "collar-eslabon",
      name: "Collar Eslabón",
      image: "assets/featured-collar-eslabon-premium.jpg",
      alt: "Collar de eslabones dorados en fotografía de estudio sobre fondo marfil claro",
      href: "#coleccion/collares",
      price: "$39.990",
      previousPrice: "$49.990",
      discount: "−20%",
    },
    {
      id: "aro-huggie",
      name: "Aro Colgante",
      image: "assets/featured-aro-colgante-premium.jpg",
      alt: "Aros dorados colgantes en fotografía de estudio sobre fondo marfil claro",
      href: "#coleccion/aros",
      price: "$19.990",
      previousPrice: "$26.990",
      discount: "−26%",
    },
    {
      id: "collar-medalla",
      name: "Collar Gota",
      image: "assets/featured-collar-gota-premium.jpg",
      alt: "Collar fino dorado con colgante de gota en fotografía de estudio sobre fondo marfil claro",
      href: "#coleccion/collares",
      price: "$32.990",
      previousPrice: "$42.990",
      discount: "−24%",
    },
  ];
  return `
    <section class="featured-products" aria-label="Productos destacados" aria-roledescription="carrusel">
      <div class="featured-header">
        <h2>Nuestros favoritos</h2>
        <div class="carousel-navigation" aria-label="Navegación de productos destacados">
          <span id="featured-position" aria-live="polite" aria-atomic="true">01 / ${String(highlights.length).padStart(2, "0")}</span>
          <button class="btn btn-circle btn-ghost" data-slide="-1" aria-label="Productos anteriores" aria-controls="featured-track" disabled>←</button>
          <button class="btn btn-circle btn-ghost" data-slide="1" aria-label="Productos siguientes" aria-controls="featured-track">→</button>
        </div>
      </div>
      <div class="featured-track carousel carousel-horizontal" id="featured-track" tabindex="0" aria-label="Aros y collares. Usa las flechas del teclado para recorrerlos">
        ${highlights.map((item, index) => `
          <article class="featured-slide carousel-item featured-slide--${item.id}" role="group" aria-roledescription="diapositiva" aria-label="${index + 1} de ${highlights.length}">
            <a class="featured-product-link" href="${item.href}" aria-label="${item.name}, precio de referencia ${item.price}, antes ${item.previousPrice}, descuento ${item.discount}">
              <span class="featured-product-image">
                <img class="panel-jewel" src="${item.image}" alt="${item.alt}" width="1254" height="1254" loading="lazy" />
                <span class="featured-badges" aria-label="Características"><span>316L</span><span>PVD 18K</span><span>Waterproof</span></span>
              </span>
              <span class="featured-product-info">
                <span class="featured-product-heading"><span class="featured-product-name">${item.name}</span><span class="featured-open" aria-hidden="true">↗</span></span>
                <span class="featured-pricing"><span class="featured-current-price">${item.price}</span><s class="featured-previous-price">${item.previousPrice}</s><span class="featured-discount">${item.discount}</span></span>
              </span>
            </a>
          </article>`).join("")}
      </div>
    </section>`;
}

export function categoryShortcuts() {
  return `
    <section class="category-discovery reveal" aria-labelledby="category-discovery-title">
      <div class="category-heading">
        <h2 id="category-discovery-title">Catálogo</h2>
      </div>
      <div class="category-grid">
        ${productCategories.map((category) => `
          <a class="card category-card" href="#coleccion/${category.type}" aria-label="Ver ${category.name.toLowerCase()}: ${category.description}">
            <figure><img src="${category.image}" alt="${category.alt}" width="1242" height="1242" loading="lazy" /></figure>
            <div class="card-body">
              <div class="category-card-copy">
                <h3 class="card-title">${category.name}</h3>
                <p>${category.description}</p>
              </div>
              <span class="category-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </span>
            </div>
          </a>`).join("")}
      </div>
    </section>`;
}

export function productAttributes() {
  return `
    <section class="product-values" aria-label="Materiales y beneficios de las joyas Eulán">
      <article class="benefit-story benefit-story--waterproof reveal" aria-labelledby="benefit-waterproof-title">
        <figure class="benefit-story__media">
          <img src="assets/editorial-waterproof.webp" alt="Mujer junto al mar con aros dorados durante una pausa en su día" width="1536" height="1024" loading="lazy" />
        </figure>
        <div class="benefit-story__content">
          <p class="benefit-story__eyebrow">Comodidad para cada día</p>
          <h2 id="benefit-waterproof-title">Waterproof</h2>
          <p>Ducha, piscina, mar y sudor: el acabado PVD resiste mejor que un baño tradicional y te acompaña en los distintos momentos de tu rutina.</p>
        </div>
      </article>

      <article class="benefit-story benefit-story--pvd reveal" aria-labelledby="benefit-pvd-title">
        <figure class="benefit-story__media">
          <img src="assets/editorial-pvd.webp" alt="Detalle de un aro dorado sobre piedra clara, con reflejos suaves" width="1536" height="1024" loading="lazy" />
        </figure>
        <div class="benefit-story__content">
          <p class="benefit-story__eyebrow">Un acabado pensado para durar</p>
          <h2 id="benefit-pvd-title">PVD en oro 18K</h2>
          <p>PVD (deposición física de vapor) aplica una capa de oro al acero dentro de una cámara de vacío. Frente a un baño tradicional, este acabado resiste mejor el roce diario.</p>
        </div>
      </article>

      <article class="benefit-story benefit-story--skin reveal" aria-labelledby="benefit-skin-title">
        <figure class="benefit-story__media">
          <img src="assets/editorial-skin.webp" alt="Retrato cercano de una mujer con un aro dorado y piel al natural" width="1536" height="1024" loading="lazy" />
        </figure>
        <div class="benefit-story__content">
          <p class="benefit-story__eyebrow">Suaves con tu piel</p>
          <h2 id="benefit-skin-title">Hipoalergénicas y libres de níquel</h2>
          <p>Diseñadas sin níquel para un contacto más cómodo con la piel. Formas livianas y versátiles para llevarlas de la mañana a la noche.</p>
        </div>
      </article>
    </section>`;
}
