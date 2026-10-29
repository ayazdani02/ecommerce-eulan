import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RouteReady } from "@/components/RouteReady";
export const metadata: Metadata = {
  title: "Universo EULÁN",
  alternates: { canonical: "/sobre-eulan" },
};
export default function Page() {
  return (
    <>
      <section className="universe-lead">
        <h1>Lo simple también tiene carácter.</h1>
        <p>
          Joyería contemporánea, Chile. Formas simples, cercanía y cuidado del
          detalle.
        </p>
        <p className="demo-note">
          Texto editorial provisional. La historia oficial de la marca está
          pendiente de confirmación.
        </p>
      </section>
      <section className="editorial">
        <Image
          src="/assets/coast-square.webp"
          alt="Retrato con aro rectangular dorado junto al mar, fotografía facilitada por EULÁN"
          width={1200}
          height={1000}
          sizes="(max-width:767px) 100vw, 50vw"
          loading="eager"
        />
        <div className="editorial-copy">
          <h2>
            Menos ruido.
            <br />
            Más presencia.
          </h2>
          <p>
            La piel, el movimiento del pelo y el reflejo del metal. Una mirada
            natural hacia las piezas que nos acompañan.
          </p>
          <Link href="/catalogo" className="underlined">
            Ver colección
          </Link>
        </div>
      </section>
      <section className="intro">
        <p className="small-label">Una mirada natural</p>
        <p>
          La firma, la imagen y las palabras comparten un mismo ritmo: claro,
          natural y personal.
        </p>
      </section>
      <RouteReady />
    </>
  );
}
