import type { CatalogQuery, Money, Product } from "./models";
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}
export function lowestPrice(product: Product): Money {
  return product.variants.reduce(
    (min, v) => (v.price.amount < min.amount ? v.price : min),
    product.variants[0].price,
  );
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL");
export function filterProducts(
  products: Product[],
  query: CatalogQuery = {},
): Product[] {
  const result = products.filter(
    (p) =>
      (!query.category || p.category === query.category) &&
      (!query.collection || p.collectionSlugs.includes(query.collection)) &&
      (!query.query ||
        normalize(`${p.name} ${p.description} ${p.category}`).includes(
          normalize(query.query.trim()),
        )) &&
      (!query.finish ||
        p.variants.some((v) => v.options.Acabado === query.finish)) &&
      (!query.available || p.variants.some((v) => v.available)),
  );
  if (query.sort === "precio-asc")
    result.sort((a, b) => lowestPrice(a).amount - lowestPrice(b).amount);
  if (query.sort === "precio-desc")
    result.sort((a, b) => lowestPrice(b).amount - lowestPrice(a).amount);
  if (query.sort === "nombre")
    result.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return result;
}
