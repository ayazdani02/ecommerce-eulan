import type { MetadataRoute } from "next";
import { commerce } from "@/commerce/provider";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const provider = commerce();
  const [products, collections] = await Promise.all([
    provider.getProducts(),
    provider.getCollections(),
  ]);
  return [
    "/",
    "/catalogo",
    "/sobre-eulan",
    "/contacto",
    "/preguntas-frecuentes",
    "/envios",
    "/cambios-y-devoluciones",
    "/cuidados",
    ...collections.map((c) => `/colecciones/${c.slug}`),
    ...products.map((p) => `/productos/${p.slug}`),
  ].map((path) => ({ url: `${base}${path}` }));
}
