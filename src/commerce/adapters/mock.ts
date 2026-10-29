import type {
  Cart,
  CartAction,
  Collection,
  CommerceProvider,
  Product,
} from "../models";
import { filterProducts } from "../catalog";
const image = (file: string, alt: string) => ({
  url: `/assets/${file}`,
  alt,
  width: 1254,
  height: 1254,
});
const entries = [
  [
    "aro-volumen",
    "Aro Volumen",
    "aros",
    "featured-aro-volumen-premium.jpg",
    24990,
    "Volumen suave. Una forma orgánica que recoge la luz.",
  ],
  [
    "aro-lagrima",
    "Aro Lágrima",
    "aros",
    "featured-aro-lagrima-premium.jpg",
    22990,
    "Una silueta alargada, simple y expresiva.",
  ],
  [
    "collar-eslabon",
    "Collar Eslabón",
    "collares",
    "featured-collar-eslabon-premium.jpg",
    39990,
    "Eslabones que acompañan cada movimiento.",
  ],
  [
    "aro-colgante",
    "Aro Colgante",
    "aros",
    "featured-aro-colgante-premium.jpg",
    19990,
    "Un pequeño gesto dorado que enmarca el rostro.",
  ],
  [
    "collar-gota",
    "Collar Gota",
    "collares",
    "featured-collar-gota-premium.jpg",
    32990,
    "Un reflejo suspendido. Una cadena delicada y una forma esencial.",
  ],
  [
    "aros-curva",
    "Aros Curva",
    "aros",
    "gold-product.webp",
    27990,
    "Una curva continua. Volumen y reflejos que cambian con la luz.",
  ],
] as const;
export const mockProducts: Product[] = entries.map(
  ([slug, name, category, file, price, description], i) => ({
    id: slug,
    slug,
    name,
    category,
    description,
    demo: true,
    collectionSlugs: [category],
    images: [image(file, `${name}, imagen conceptual de referencia`)],
    variants: (i === 0 ? ["Dorado", "Dorado suave"] : ["Dorado"]).map(
      (finish, j) => ({
        id: `${slug}-${j}`,
        name: finish,
        options: { Acabado: finish },
        price: { amount: price, currency: "CLP" },
        available: i !== 5,
        stock: i === 5 ? 0 : 8,
      }),
    ),
    materials: [
      "Propuesta: acero inoxidable 316L y acabado PVD en oro 18K. Composición y medidas pendientes de confirmación para el catálogo real.",
    ],
    materialsDescription:
      "Propuesta conceptual: acero inoxidable 316L con acabado PVD en tono dorado. Composición, propiedades y cuidados pendientes de confirmar para el catálogo real.",
    care: "Guía provisional: guardar por separado y limpiar suavemente con un paño seco. Confirmar los cuidados según la composición de cada pieza.",
  }),
);
export const mockCollections: Collection[] = [
  {
    slug: "aros",
    name: "Aros",
    description: "Formas que enmarcan el rostro.",
    image: image(
      "category-aros-natural-reference.webp",
      "Modelo con aros dorados, fotografía de referencia de EULÁN",
    ),
  },
  {
    slug: "collares",
    name: "Collares",
    description: "Detalles que acompañan cada gesto.",
    image: image(
      "category-collares-referencia.webp",
      "Detalle de un collar de eslabones dorados",
    ),
  },
];
type StoredLine = { variantId: string; quantity: number };
function decode(id?: string): StoredLine[] {
  if (!id) return [];
  try {
    const data: unknown = JSON.parse(Buffer.from(id, "base64url").toString());
    if (!Array.isArray(data) || data.length > 30) return [];
    const seen = new Set<string>();
    return data.filter((l): l is StoredLine => {
      if (
        !l ||
        typeof l !== "object" ||
        typeof l.variantId !== "string" ||
        seen.has(l.variantId) ||
        !Number.isInteger(l.quantity) ||
        l.quantity < 1 ||
        l.quantity > 8
      )
        return false;
      seen.add(l.variantId);
      return true;
    });
  } catch {
    return [];
  }
}
function cartFrom(lines: StoredLine[]): Cart {
  const valid = lines.flatMap((line) => {
    const product = mockProducts.find((p) =>
      p.variants.some((v) => v.id === line.variantId),
    );
    const variant = product?.variants.find((v) => v.id === line.variantId);
    if (!product || !variant || !variant.available) return [];
    return [
      {
        id: variant.id,
        product,
        variant,
        quantity: Math.min(line.quantity, variant.stock ?? 8),
      },
    ];
  });
  return {
    id: Buffer.from(
      JSON.stringify(
        valid.map((l) => ({ variantId: l.variant.id, quantity: l.quantity })),
      ),
    ).toString("base64url"),
    lines: valid,
    subtotal: {
      amount: valid.reduce(
        (sum, l) => sum + l.variant.price.amount * l.quantity,
        0,
      ),
      currency: "CLP",
    },
    totalQuantity: valid.reduce((sum, l) => sum + l.quantity, 0),
    demo: true,
  };
}
export const mockProvider: CommerceProvider = {
  name: "mock",
  async getProducts(query) {
    return filterProducts(mockProducts, query);
  },
  async getProduct(slug) {
    return mockProducts.find((p) => p.slug === slug) ?? null;
  },
  async getCollections() {
    return mockCollections;
  },
  async getCollection(slug) {
    return mockCollections.find((c) => c.slug === slug) ?? null;
  },
  async getCart(id) {
    return cartFrom(decode(id));
  },
  async mutateCart(id, action: CartAction) {
    const lines = decode(id);
    if (
      action.type !== "remove" &&
      (!Number.isInteger(action.quantity) ||
        action.quantity < (action.type === "add" ? 1 : 0) ||
        action.quantity > 99)
    )
      throw new Error("Cantidad inválida.");
    if (action.type === "add") {
      const variant = mockProducts
        .flatMap((p) => p.variants)
        .find((v) => v.id === action.variantId);
      if (!variant?.available)
        throw new Error("Esta variante no está disponible.");
      const current = lines.find((l) => l.variantId === action.variantId);
      const next = (current?.quantity ?? 0) + action.quantity;
      if (next > (variant.stock ?? 8))
        throw new Error("No hay más unidades disponibles de esta variante.");
      if (current) current.quantity = next;
      else
        lines.push({ variantId: action.variantId, quantity: action.quantity });
    } else {
      const index = lines.findIndex((l) => l.variantId === action.lineId);
      if (index < 0) throw new Error("El artículo ya no está en el carrito.");
      if (action.type === "remove" || action.quantity === 0)
        lines.splice(index, 1);
      else {
        const variant = mockProducts
          .flatMap((p) => p.variants)
          .find((v) => v.id === action.lineId);
        if (!variant || action.quantity > (variant.stock ?? 8))
          throw new Error("Cantidad no disponible.");
        lines[index].quantity = action.quantity;
      }
    }
    if (lines.length > 30)
      throw new Error("El carrito alcanzó su límite de artículos.");
    return cartFrom(lines);
  },
  async checkout() {
    return {
      type: "unavailable",
      message:
        "Modo demostración: no se generan pedidos, reservas ni cobros. El pago seguro se habilitará al configurar Shopify.",
    };
  },
};
