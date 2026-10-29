import Image from "next/image";

const stories = [
  {
    id: "pvd",
    title: "Un brillo que se une al acero.",
    description:
      "PVD significa deposición física de vapor. En una cámara de vacío, el oro real de 18K se deposita sobre acero inoxidable 316L en una capa adherente que ayuda a resistir el roce cotidiano.",
    note: "ORO 18K · ACERO 316L · PVD",
    image: "/assets/quality-story-teardrop.webp",
    alt: "Pendientes dorados de gota fotografiados en ángulo sobre fondo blanco",
  },
  {
    id: "waterproof",
    title: "Hechas para acompañarte, también en el agua.",
    description:
      "Sudor, ducha, baño y días de playa: el acero inoxidable 316L está pensado para acompañarte. Resiste la oxidación, por eso nuestras piezas no se ponen verdes; el acabado PVD ayuda a conservar el tono dorado. Después del mar o la piscina, enjuaga y seca tu pieza para cuidar su brillo.",
    note: "SUDOR · DUCHA · PLAYA",
    image: "/assets/quality-story-waterproof.webp",
    alt: "Aros dorados con forma de flor sobre fondo blanco con gotas de agua",
  },
  {
    id: "gold",
    title: "El dorado empieza con oro real.",
    description:
      "No es solo un tono dorado: nuestras piezas llevan oro real de 18K aplicado sobre acero inoxidable 316L mediante tecnología PVD, para combinar un acabado luminoso con una base resistente.",
    note: "ORO REAL DE 18K",
    image: "/assets/quality-story-gold.webp",
    alt: "Aros dorados colgantes con forma de corazón en una composición diagonal de estudio",
  },
];

export function ProductQualityStories() {
  return (
    <section className="product-quality-stories" aria-labelledby="product-quality-title">
      <header className="product-quality-stories__intro">
        <h2 id="product-quality-title">La calidad se nota.</h2>
        <p>Materiales seleccionados para acompañarte día tras día.</p>
      </header>

      <div className="product-quality-stories__slides">
        {stories.map((story) => (
          <article
            key={story.id}
            className={`product-quality-slide product-quality-slide--${story.id}`}
            aria-labelledby={`product-quality-${story.id}`}
          >
            <figure className="product-quality-slide__visual">
              <Image
                src={story.image}
                alt={story.alt}
                width={1254}
                height={1254}
                sizes="(max-width: 767px) 88vw, 540px"
                quality={90}
                loading="lazy"
              />
              <figcaption>{story.note}</figcaption>
            </figure>
            <div className="product-quality-slide__copy">
              <h3 id={`product-quality-${story.id}`}>{story.title}</h3>
              <p>{story.description}</p>
              {story.id === "pvd" && (
                <div className="product-quality-layers" aria-label="Capas del material">
                  <div><span className="product-quality-layers__gold" /><span>ORO REAL 18K</span></div>
                  <div><span className="product-quality-layers__pvd" /><span>CAPA PVD</span></div>
                  <div><span className="product-quality-layers__steel" /><span>ACERO 316L</span></div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
