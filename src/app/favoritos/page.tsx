import type { Metadata } from "next";
import { commerce } from "@/commerce/provider";
import { FavoritesPage } from "@/components/FavoritesPage";

export const metadata: Metadata = {
  title: "Favoritos",
  alternates: { canonical: "/favoritos" },
};

export default async function Page() {
  const products = await commerce().getProducts();
  return <FavoritesPage products={products} />;
}
