import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { infoPages } from "@/content";
import { ContactForm } from "@/components/ContactForm";
import { RouteReady } from "@/components/RouteReady";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return Object.keys(infoPages).map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = infoPages[slug];
  return {
    title: p?.title ?? "Página no encontrada",
    description: p?.lead,
    alternates: { canonical: `/${slug}` },
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = infoPages[slug];
  if (!p) notFound();
  return (
    <article className="editorial-page">
      <p className="eyebrow">Información / EULÁN</p>
      <h1>{p.title}</h1>
      <p className="lead">{p.lead}</p>
      <div className="prose">
        {p.sections.map((s, i) =>
          slug === "preguntas-frecuentes" ? (
            <details key={s.title} open={i === 0}>
              <summary>{s.title}</summary>
              <p>{s.text}</p>
            </details>
          ) : (
            <section key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.text}</p>
            </section>
          ),
        )}
      </div>
      {slug === "contacto" && <ContactForm />}
      <nav className="info-links" aria-label="Seguir explorando">
        <Link className="underlined" href="/catalogo">
          Explorar la colección
        </Link>
        {slug !== "contacto" && (
          <Link className="underlined" href="/contacto">
            Contacto
          </Link>
        )}
      </nav>
      <RouteReady />
    </article>
  );
}
