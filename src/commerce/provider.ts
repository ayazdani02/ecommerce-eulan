import "server-only";
import type { CommerceProvider } from "./models";
import { mockProvider } from "./adapters/mock";
import { shopifyProvider } from "./adapters/shopify";
export function commerce(): CommerceProvider {
  const provider = process.env.COMMERCE_PROVIDER ?? "mock";
  if (provider === "mock") return mockProvider;
  if (provider === "shopify") return shopifyProvider;
  throw new Error(`Proveedor commerce no configurado: ${provider}`);
}
