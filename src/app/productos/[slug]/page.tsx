import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { commerce } from "@/commerce/provider";
import { ProductDetail } from "@/components/ProductDetail";
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
  const p = await commerce().getProduct(slug);
  if (!p) notFound();
  return <ProductDetail product={p} />;
}
