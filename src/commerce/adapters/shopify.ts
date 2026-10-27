import "server-only";
import { createStorefrontClient } from "@shopify/hydrogen-react";
import type {
  Cart,
  CartAction,
  Collection,
  CommerceProvider,
  Product,
  ProductImage,
  Variant,
} from "../models";
import { filterProducts } from "../catalog";
type Connection<T> = { nodes: T[] };
type RawImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};
type RawMoney = { amount: string; currencyCode: string };
type RawVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: RawMoney;
  selectedOptions: { name: string; value: string }[];
};
type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  images: Connection<RawImage>;
  variants: Connection<RawVariant>;
  collections: Connection<{ handle: string }>;
  materials?: { value: string } | null;
  care?: { value: string } | null;
};
type RawCollection = {
  handle: string;
  title: string;
  description: string;
  image: RawImage | null;
};
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: RawMoney };
  lines: Connection<{
    id: string;
    quantity: number;
    merchandise: RawVariant & { product: RawProduct };
  }>;
};
const IMAGE = "url altText width height";
const VARIANT =
  "id title availableForSale price { amount currencyCode } selectedOptions { name value }";
const PRODUCT = `id handle title description productType images(first:10){nodes{${IMAGE}}} variants(first:100){nodes{${VARIANT}}} collections(first:20){nodes{handle}} materials:metafield(namespace:"custom",key:"materials"){value} care:metafield(namespace:"custom",key:"care"){value}`;
const CART = `id checkoutUrl totalQuantity cost{subtotalAmount{amount currencyCode}} lines(first:100){nodes{id quantity merchandise{... on ProductVariant{${VARIANT} product{${PRODUCT}}}}}}`;
const CONTEXT = "@inContext(country: CL, language: ES)";
function config() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN,
    token = process.env.SHOPIFY_PRIVATE_STOREFRONT_TOKEN;
  if (!domain || !token || !/^[-a-z0-9]+\.myshopify\.com$/.test(domain))
    throw new Error(
      "Configura el dominio myshopify.com y el token privado de Shopify.",
    );
  return createStorefrontClient({
    storeDomain: domain,
    privateStorefrontToken: token,
    storefrontApiVersion:
      process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2026-04",
  });
}
async function request<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const client = config();
  const response = await fetch(client.getStorefrontApiUrl(), {
    method: "POST",
    headers: client.getPrivateTokenHeaders(),
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw new Error(
      "No pudimos conectar con el catálogo. Inténtalo nuevamente.",
    );
  const data = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (data.errors?.length || !data.data)
    throw new Error("El servicio de la tienda no pudo completar la solicitud.");
  return data.data;
}
function money(raw: RawMoney) {
  if (raw.currencyCode !== "CLP")
    throw new Error("El catálogo debe estar configurado en CLP para Chile.");
  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error("Precio de catálogo inválido.");
  return { amount: Math.round(amount), currency: "CLP" as const };
}
function image(raw: RawImage): ProductImage {
  return {
    url: raw.url,
    alt: raw.altText ?? "Joyería EULÁN",
    width: raw.width || 1200,
    height: raw.height || 1200,
  };
}
function variant(raw: RawVariant): Variant {
  return {
    id: raw.id,
    name: raw.title,
    price: money(raw.price),
    available: raw.availableForSale,
    options: Object.fromEntries(
      raw.selectedOptions.map((o) => [o.name, o.value]),
    ),
  };
}
function product(raw: RawProduct): Product {
  return {
    id: raw.id,
    slug: raw.handle,
    name: raw.title,
    description: raw.description,
    category: raw.productType.toLowerCase(),
    images: raw.images.nodes.map(image),
    variants: raw.variants.nodes.map(variant),
    collectionSlugs: raw.collections.nodes.map((c) => c.handle),
    materials:
      raw.materials?.value ??
      "Información de materiales pendiente de confirmar.",
    care:
      raw.care?.value ??
      "Consulta los cuidados específicos de esta pieza antes de comprar.",
    demo: false,
  };
}
function collection(raw: RawCollection): Collection {
  return {
    slug: raw.handle,
    name: raw.title,
    description: raw.description,
    image: raw.image ? image(raw.image) : undefined,
  };
}
function cart(raw: RawCart): Cart {
  return {
    id: raw.id,
    lines: raw.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      product: product(l.merchandise.product),
      variant: variant(l.merchandise),
    })),
    subtotal: money(raw.cost.subtotalAmount),
    totalQuantity: raw.totalQuantity,
    demo: false,
  };
}
const empty = (): Cart => ({
  id: "",
  lines: [],
  subtotal: { amount: 0, currency: "CLP" },
  totalQuantity: 0,
  demo: false,
});
async function readCart(id: string) {
  return (
    await request<{ cart: RawCart | null }>(
      `query($id:ID!) ${CONTEXT}{cart(id:$id){${CART}}}`,
      { id },
    )
  ).cart;
}
async function mutation(
  field: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<Cart> {
  const data = await request<
    Record<
      string,
      {
        cart: RawCart | null;
        userErrors: { message: string }[];
        warnings?: { message: string }[];
      }
    >
  >(query, variables);
  const result = data[field];
  if (result.userErrors.length || !result.cart)
    throw new Error(
      result.userErrors[0]?.message ?? "No pudimos actualizar el carrito.",
    );
  // Shopify puede ajustar cantidades al stock. El carrito devuelto es la fuente de verdad.
  return cart(result.cart);
}
export const shopifyProvider: CommerceProvider = {
  name: "shopify",
  async getProducts(query) {
    // Paginación completa del catálogo; no truncar silenciosamente al primer lote.
    let cursor: string | null = null;
    const products: Product[] = [];
    do {
      const data: {
        products: Connection<RawProduct> & {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } = await request(
        `query($cursor:String) ${CONTEXT}{products(first:100,after:$cursor){nodes{${PRODUCT}} pageInfo{hasNextPage endCursor}}}`,
        { cursor },
      );
      products.push(
        ...data.products.nodes
          .filter((p) => p.variants.nodes.length)
          .map(product),
      );
      cursor = data.products.pageInfo.hasNextPage
        ? data.products.pageInfo.endCursor
        : null;
    } while (cursor);
    return filterProducts(products, query);
  },
  async getProduct(slug) {
    const data = await request<{ product: RawProduct | null }>(
      `query($slug:String!) ${CONTEXT}{product(handle:$slug){${PRODUCT}}}`,
      { slug },
    );
    return data.product && data.product.variants.nodes.length
      ? product(data.product)
      : null;
  },
  async getCollections() {
    const data = await request<{ collections: Connection<RawCollection> }>(
      `query ${CONTEXT}{collections(first:100){nodes{handle title description image{${IMAGE}}}}}`,
    );
    return data.collections.nodes.map(collection);
  },
  async getCollection(slug) {
    const data = await request<{ collection: RawCollection | null }>(
      `query($slug:String!) ${CONTEXT}{collection(handle:$slug){handle title description image{${IMAGE}}}}`,
      { slug },
    );
    return data.collection ? collection(data.collection) : null;
  },
  async getCart(id) {
    if (!id) return empty();
    const raw = await readCart(id);
    return raw ? cart(raw) : empty();
  },
  async mutateCart(id, action: CartAction) {
    const existing = id ? await readCart(id) : null;
    if (!existing) {
      if (action.type !== "add")
        throw new Error("El carrito expiró. Vuelve a agregar las piezas.");
      return mutation(
        "cartCreate",
        `mutation($input:CartInput!) ${CONTEXT}{cartCreate(input:$input){cart{${CART}} userErrors{message}}}`,
        {
          input: {
            buyerIdentity: { countryCode: "CL" },
            lines: [
              { merchandiseId: action.variantId, quantity: action.quantity },
            ],
          },
        },
      );
    }
    if (action.type === "add")
      return mutation(
        "cartLinesAdd",
        `mutation($id:ID!,$lines:[CartLineInput!]!) ${CONTEXT}{cartLinesAdd(cartId:$id,lines:$lines){cart{${CART}} userErrors{message}}}`,
        {
          id: existing.id,
          lines: [
            { merchandiseId: action.variantId, quantity: action.quantity },
          ],
        },
      );
    if (action.type === "remove" || action.quantity === 0)
      return mutation(
        "cartLinesRemove",
        `mutation($id:ID!,$lines:[ID!]!) ${CONTEXT}{cartLinesRemove(cartId:$id,lineIds:$lines){cart{${CART}} userErrors{message}}}`,
        { id: existing.id, lines: [action.lineId] },
      );
    return mutation(
      "cartLinesUpdate",
      `mutation($id:ID!,$lines:[CartLineUpdateInput!]!) ${CONTEXT}{cartLinesUpdate(cartId:$id,lines:$lines){cart{${CART}} userErrors{message}}}`,
      {
        id: existing.id,
        lines: [{ id: action.lineId, quantity: action.quantity }],
      },
    );
  },
  async checkout(id) {
    const raw = await readCart(id);
    if (!raw?.lines.nodes.length)
      return {
        type: "unavailable",
        message: "Tu carrito está vacío o expiró.",
      };
    const url = new URL(raw.checkoutUrl);
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    if (
      url.protocol !== "https:" ||
      !(
        url.hostname === domain ||
        url.hostname.endsWith(".myshopify.com") ||
        url.hostname === "checkout.shopify.com" ||
        url.hostname === "shop.app"
      )
    )
      throw new Error("Dominio de checkout no autorizado.");
    return { type: "redirect", url: url.toString() };
  },
};
