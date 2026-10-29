export type Money = { amount: number; currency: "CLP" };
export type ProductImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};
export type Variant = {
  id: string;
  name: string;
  sku?: string | null;
  compareAtPrice?: Money | null;
  options: Record<string, string>;
  price: Money;
  available: boolean;
  stock?: number;
};
export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  images: ProductImage[];
  variants: Variant[];
  materials: string[];
  materialsDescription: string;
  care: string;
  demo: boolean;
  collectionSlugs: string[];
};
export type Collection = {
  slug: string;
  name: string;
  description: string;
  image?: ProductImage;
};
export type CatalogQuery = {
  category?: string;
  query?: string;
  finish?: string;
  available?: boolean;
  sort?: string;
  collection?: string;
};
export type CartLine = {
  id: string;
  product: Pick<Product, "id" | "slug" | "name" | "images">;
  variant: Variant;
  quantity: number;
};
export type Cart = {
  id: string;
  lines: CartLine[];
  subtotal: Money;
  totalQuantity: number;
  demo: boolean;
};
export type CartAction =
  | { type: "add"; variantId: string; quantity: number }
  | { type: "update"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string };
export type CheckoutResult =
  | { type: "redirect"; url: string }
  | { type: "unavailable"; message: string }
  | { type: "session"; sessionId: string; path: string };
export interface CommerceProvider {
  readonly name: "mock" | "shopify" | "medusa";
  getAccountLoginUrl(): string | null;
  getProducts(query?: CatalogQuery): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  getCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  getCart(id?: string): Promise<Cart>;
  mutateCart(id: string | undefined, action: CartAction): Promise<Cart>;
  checkout(id: string): Promise<CheckoutResult>;
}
