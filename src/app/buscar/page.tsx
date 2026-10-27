import type { Metadata } from "next";
import { Catalog, type SearchParams } from "@/components/Catalog";
export const metadata: Metadata = {
  title: "Buscar una pieza",
  robots: { index: false, follow: true },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">Una forma de encontrarte</p>
        <h1>Busca tu próxima pieza.</h1>
        <p>Explora por nombre, categoría o acabado.</p>
      </section>
      <Catalog searchParams={await searchParams} search />
    </>
  );
}
