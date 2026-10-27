import Image from "next/image";
import Link from "next/link";
import { commerce } from "@/commerce/provider";
import { FeaturedProducts } from "./FeaturedProducts";
import { HomeEnhancements } from "./HomeEnhancements";
// Composición y clases migradas del Home original, sin rediseño.
export async function Home() {
  const products = (await commerce().getProducts()).slice(0, 5);
  return (
    <HomeEnhancements>
      <section
        className="hero immersive-hero hero-carousel"
        data-hero-carousel
        aria-label="Historias de eulán"
      >
        <article
          className="hero-slide hero-slide--campaign is-active"
          data-hero-slide
          aria-hidden="false"
        >
          <picture className="hero-picture">
            <Image
              sizes="100vw"
              className="hero-img"
              src="/assets/hero-desktop-blur.webp"
              alt="Modelo de eulán junto al mar, propuesta de imagen con fondo desenfocado"
              fetchPriority="high"
              priority
              width="1536"
              height="1024"
            />
          </picture>
          <div className="hero-copy">
            <h1>
              Waterproof.
              <br /> Todo el día.
            </h1>
            <ul
              className="hero-attributes"
              aria-label="Atributos de las joyas eulán"
            >
              <li>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M16 3.5S7.8 13 7.8 19.1a8.2 8.2 0 1 0 16.4 0C24.2 13 16 3.5 16 3.5Z" />
                  <path d="M12.2 20.4a4.1 4.1 0 0 0 4.1 4.1" />
                </svg>
                <span>
                  <strong>Resistentes al agua</strong>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="m16 4 11 6-11 6-11-6 11-6Z" />
                  <path d="m5 15 11 6 11-6M5 20l11 6 11-6" />
                </svg>
                <span>
                  <strong>Baño PVD oro 18K</strong>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M16 3.5 27 7v8.2c0 6.6-4.4 11.1-11 14.3C10.4 26.3 6 21.8 6 15.2V7l10-3.5Z" />
                  <path d="m11.5 15.8 3 3 6.2-6.5" />
                </svg>
                <span>
                  <strong>Acero inoxidable 316L</strong>
                </span>
              </li>
              <li>
                <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <path d="M26.5 5.5C15.2 6.1 7 10.8 7 19.1c0 4.1 2.8 6.8 6.7 6.8 8.5 0 12.4-9.1 12.8-20.4Z" />
                  <path d="M5 28c4.8-7 9.6-11.8 16-16.2" />
                </svg>
                <span>
                  <strong>Hipoalergénicas</strong>
                </span>
              </li>
            </ul>
            <Link className="button btn hero-collection-cta" href="/catalogo">
              Ver toda la colección <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
        <article
          className="hero-slide hero-slide--product"
          data-hero-slide
          aria-hidden="true"
          inert={true}
        >
          <picture className="hero-product-picture">
            <source
              media="(max-width: 767px)"
              srcSet="/assets/hero-aros-mobile.webp"
            />
            <Image
              sizes="100vw"
              className="hero-product-image"
              src="/assets/hero-aros-v2.webp"
              alt="Aros dorados sobre una superficie cerámica marfil, propuesta conceptual de eulán"
              width="1774"
              height="887"
            />
          </picture>
          <div className="hero-copy hero-product-copy">
            <h2>
              Livianos.
              <br />
              Cómodos.
            </h2>
            <p className="hero-product-description">
              Aros diseñados para acompañarte con comodidad, de la mañana a la
              noche.
            </p>
            <Link className="button btn" href="/colecciones/aros">
              Descubrir los aros <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
        <article
          className="hero-slide hero-slide--gift"
          data-hero-slide
          aria-hidden="true"
          inert={true}
        >
          <picture className="hero-gift-picture">
            <Image
              sizes="100vw"
              className="hero-gift-image"
              src="/assets/hero-regalo.jpg"
              alt="Collar dorado sobre tela azul marino con orquídeas y detalles festivos"
              width="1536"
              height="1024"
            />
          </picture>
          <div className="hero-copy hero-gift-copy">
            <h2>El regalo perfecto</h2>
            <Link className="button btn" href="/catalogo">
              Descubrir la colección <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </article>
        <div
          className="hero-controls join join-horizontal"
          role="group"
          aria-label="Elegir escena del hero"
        >
          <button
            type="button"
            className="hero-scene-option join-item btn"
            data-hero-scene="0"
            aria-label="Mostrar escena: Campaña"
            aria-pressed="true"
          >
            <Image
              className="hero-scene-thumbnail"
              src="/assets/hero-desktop-blur.webp"
              alt=""
              width="48"
              height="48"
            />
            <svg className="hero-scene-clock" fill="none" aria-hidden="true">
              <rect className="hero-clock-track" x="2" y="2" rx="2" />
              <rect className="hero-clock-fill" x="2" y="2" rx="2" />
            </svg>
            <span className="hero-scene-countdown" aria-hidden="true">10 s</span>
          </button>
          <button
            type="button"
            className="hero-scene-option join-item btn"
            data-hero-scene="1"
            aria-label="Mostrar escena: Detalle del producto"
            aria-pressed="false"
          >
            <Image
              className="hero-scene-thumbnail"
              src="/assets/hero-aros-v2.webp"
              alt=""
              width="48"
              height="48"
            />
            <svg className="hero-scene-clock" fill="none" aria-hidden="true">
              <rect className="hero-clock-track" x="2" y="2" rx="2" />
              <rect className="hero-clock-fill" x="2" y="2" rx="2" />
            </svg>
            <span className="hero-scene-countdown" aria-hidden="true">8 s</span>
          </button>
          <button
            type="button"
            className="hero-scene-option join-item btn"
            data-hero-scene="2"
            aria-label="Mostrar escena: El regalo perfecto"
            aria-pressed="false"
          >
            <Image
              className="hero-scene-thumbnail"
              src="/assets/hero-regalo-thumb.jpg"
              alt=""
              width="48"
              height="48"
            />
            <svg className="hero-scene-clock" fill="none" aria-hidden="true">
              <rect className="hero-clock-track" x="2" y="2" rx="2" />
              <rect className="hero-clock-fill" x="2" y="2" rx="2" />
            </svg>
            <span className="hero-scene-countdown" aria-hidden="true">8 s</span>
          </button>
        </div>
      </section>

      <FeaturedProducts products={products} />

      <section
        className="category-discovery reveal"
        aria-labelledby="category-discovery-title"
      >
        <div className="category-heading">
          <h2 id="category-discovery-title">Catálogo</h2>
        </div>
        <div className="category-grid">
          <Link
            className="card category-card"
            href="/colecciones/aros"
            aria-label="Ver aros: Formas que enmarcan el rostro."
          >
            <figure>
              <Image
                src="/assets/category-aros-natural-reference.webp"
                alt="Primer plano natural de una modelo usando aros dorados"
                width="1242"
                height="1242"
                sizes="(max-width:767px) 100vw, 50vw"
                loading="lazy"
              />
            </figure>
            <div className="card-body">
              <div className="category-card-copy">
                <h3 className="card-title">Aros</h3>
                <p>Formas que enmarcan el rostro.</p>
              </div>
              <span className="category-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
          <Link
            className="card category-card"
            href="/colecciones/collares"
            aria-label="Ver collares: Detalles que acompañan cada gesto."
          >
            <figure>
              <Image
                src="/assets/category-collares-referencia.webp"
                alt="Primer plano de una modelo con un collar grueso de eslabones dorados"
                width="1242"
                height="1242"
                sizes="(max-width:767px) 100vw, 50vw"
                loading="lazy"
              />
            </figure>
            <div className="card-body">
              <div className="category-card-copy">
                <h3 className="card-title">Collares</h3>
                <p>Detalles que acompañan cada gesto.</p>
              </div>
              <span className="category-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section
        className="product-values"
        aria-label="Materiales y beneficios de las joyas Eulán"
      >
        <article
          className="benefit-story benefit-story--waterproof reveal"
          aria-labelledby="benefit-waterproof-title"
        >
          <figure className="benefit-story__media">
            <Image
              src="/assets/editorial-waterproof.webp"
              alt="Mujer junto al mar con aros dorados durante una pausa en su día"
              width="1536"
              height="1024"
              sizes="(max-width:767px) 100vw, 50vw"
              loading="lazy"
            />
          </figure>
          <div className="benefit-story__content">
            <p className="benefit-story__eyebrow">Comodidad para cada día</p>
            <h2 id="benefit-waterproof-title">Waterproof</h2>
            <p>
              Ducha, piscina, mar y sudor: el acabado PVD resiste mejor que un
              baño tradicional y te acompaña en los distintos momentos de tu
              rutina.
            </p>
          </div>
        </article>

        <article
          className="benefit-story benefit-story--pvd reveal"
          aria-labelledby="benefit-pvd-title"
        >
          <figure className="benefit-story__media">
            <Image
              src="/assets/featured-aro-volumen-premium.jpg"
              alt="Aros de volumen dorados sobre fondo blanco"
              width="1254"
              height="1254"
              sizes="(max-width:767px) 100vw, 65vw"
              loading="lazy"
            />
          </figure>
          <div className="benefit-story__content">
            <p className="benefit-story__eyebrow">
              Un acabado pensado para durar
            </p>
            <h2 id="benefit-pvd-title">PVD en oro 18K</h2>
            <p>
              PVD (deposición física de vapor) aplica una capa de oro al acero
              dentro de una cámara de vacío. Frente a un baño tradicional, este
              acabado resiste mejor el roce diario.
            </p>
          </div>
        </article>

        <article
          className="benefit-story benefit-story--skin reveal"
          aria-labelledby="benefit-skin-title"
        >
          <figure className="benefit-story__media">
            <Image
              src="/assets/editorial-skin.webp"
              alt="Retrato cercano de una mujer con un aro dorado y piel al natural"
              width="1536"
              height="1024"
              sizes="(max-width:767px) 100vw, 50vw"
              loading="lazy"
            />
          </figure>
          <div className="benefit-story__content">
            <p className="benefit-story__eyebrow">Suaves con tu piel</p>
            <h2 id="benefit-skin-title">Hipoalergénicas y libres de níquel</h2>
            <p>
              Diseñadas sin níquel para un contacto más cómodo con la piel.
              Formas livianas y versátiles para llevarlas de la mañana a la
              noche.
            </p>
          </div>
        </article>
      </section>
    </HomeEnhancements>
  );
}
