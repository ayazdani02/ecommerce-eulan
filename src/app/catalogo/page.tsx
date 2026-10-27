import type { Metadata } from "next";
import { Catalog, type SearchParams } from "@/components/Catalog";
import { commerce } from "@/commerce/provider";
export const metadata: Metadata = {
  title: "La colección",
  alternates: { canonical: "/catalogo" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">Aros y collares / EULÁN</p>
        <h1>La colección.</h1>
        <p>Formas simples, distintas maneras de llevarlas.</p>
        {commerce().name === "mock" && (
          <p className="demo-note">
            Catálogo de demostración. Imágenes, variantes, precios y
            disponibilidad de referencia; sujetos a confirmación.
          </p>
        )}
      </section>
      <Catalog searchParams={await searchParams} />
    </>
  );
}
