import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { commerce } from "@/commerce/provider";
import { Catalog, type SearchParams } from "@/components/Catalog";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await commerce().getCollection(slug);
  return {
    title: c?.name ?? "Colección no encontrada",
    description: c?.description,
    alternates: { canonical: `/colecciones/${slug}` },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const c = await commerce().getCollection(slug);
  if (!c) notFound();
  return (
    <>
      <section className="collection-banner">
        <div>
          <p className="eyebrow">La colección / EULÁN</p>
          <h1>{c.name}</h1>
          <p>{c.description}</p>
          {commerce().name === "mock" && (
            <p className="demo-note">
              Selección conceptual. Precios y piezas de referencia.
            </p>
          )}
        </div>
        {c.image && (
          <Image
            src={c.image.url}
            alt={c.image.alt}
            width={c.image.width}
            height={c.image.height}
            sizes="(max-width:767px) 100vw, 50vw"
            loading="eager"
          />
        )}
      </section>
      <Catalog collection={slug} searchParams={await searchParams} />
    </>
  );
}
