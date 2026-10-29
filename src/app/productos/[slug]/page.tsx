import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commerce } from "@/commerce/provider";
import { ProductDetail } from "@/components/ProductDetail";
import { RouteReady } from "@/components/RouteReady";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await commerce().getProduct(slug);
  return {
    title: p?.name ?? "Pieza no encontrada",
    description: p?.description,
    alternates: { canonical: `/productos/${slug}` },
    openGraph: p
      ? {
          title: p.name,
          description: p.description,
          images: p.images.map((i) => ({
            url: i.url,
            width: i.width,
            height: i.height,
            alt: i.alt,
          })),
        }
      : undefined,
  };
}
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const provider = commerce();
  const [p, catalog] = await Promise.all([
    provider.getProduct(slug),
    provider.getProducts(),
  ]);
  if (!p) notFound();
  const relatedProducts = catalog
    .filter((candidate) => candidate.id !== p.id)
    .sort((a, b) => {
      const affinity = (candidate: typeof p) => {
        const sameCollection = candidate.collectionSlugs.some((collection) =>
          p.collectionSlugs.includes(collection),
        );
        const sameCategory = candidate.category.toLocaleLowerCase("es")
          === p.category.toLocaleLowerCase("es");
        return Number(sameCollection) * 2 + Number(sameCategory);
      };
      return affinity(b) - affinity(a);
    })
    .slice(0, 5);
  return (
    <>
      <ProductDetail product={p} relatedProducts={relatedProducts} />
      <RouteReady />
    </>
  );
}
