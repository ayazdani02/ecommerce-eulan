import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (existsSync(".env")) process.loadEnvFile(".env");

const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-04";
const store = process.env.SHOPIFY_STORE_DOMAIN;
const cli = resolve("node_modules/.bin/shopify");
const pageSize = 50;
const variantPageSize = 100;
const retryLimit = 5;
const dimensionKeys = ["package_length", "package_width", "package_height"] as const;
const exportOnly = process.argv.includes("--export-only");

if (!store) throw new Error("SHOPIFY_STORE_DOMAIN no está configurado.");
if (!/^(20\d{2})-(01|04|07|10)$/.test(apiVersion) || apiVersion === "2027-01") {
  throw new Error(`Versión Admin API no estable o no permitida: ${apiVersion}. Usa una versión estable, por ejemplo 2026-04.`);
}

type JsonObject = Record<string, unknown>;
type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type ProductNode = JsonObject & { id: string; title: string; variants: { nodes: JsonObject[]; pageInfo: PageInfo } };

const listProductsQuery = `query ShippingProductBackup($after: String) {
  products(first: ${pageSize}, after: $after) {
    nodes {
      id title handle status vendor productType tags descriptionHtml
      options { name values }
      variants(first: ${variantPageSize}) {
        nodes {
          id title sku barcode price compareAtPrice inventoryQuantity selectedOptions { name value }
          inventoryItem { id tracked requiresShipping measurement { weight { value unit } } }
          metafields(first: 20, namespace: "custom") { nodes { namespace key type value } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

function delay(ms: number) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }

function isExpectedDimension(value: string | undefined, expected = 20) {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as { value?: unknown; unit?: unknown };
    return Number(parsed.value) === expected && parsed.unit === "centimeters";
  } catch { return false; }
}

async function execute<T>(query: string, variables: JsonObject = {}, allowMutations = false): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const args = ["store", "execute", "--store", store!, "--version", apiVersion, "--json", "--no-input", "--query", query, "--variables", JSON.stringify(variables)];
    if (allowMutations) args.push("--allow-mutations");
    const result = await new Promise<{ code: number; stdout: string; stderr: string }>((resolveResult, reject) => {
      const child = spawn(cli, args, { env: { ...process.env, SHOPIFY_CLI_NO_ANALYTICS: "1" }, stdio: ["ignore", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
      child.on("error", reject);
      child.on("close", (code) => resolveResult({ code: code ?? 1, stdout, stderr }));
    });
    let parsed: JsonObject | null = null;
    const finalJsonStart = result.stdout.lastIndexOf("\n{");
    const finalJson = finalJsonStart >= 0 ? result.stdout.slice(finalJsonStart + 1) : result.stdout.trim();
    try { parsed = JSON.parse(finalJson) as JsonObject; } catch { /* CLI returned progress output without a JSON result. */ }
    if (!parsed) {
      for (const line of result.stdout.split(/\r?\n/).reverse()) {
        try {
          const candidate = JSON.parse(line) as JsonObject;
          if (candidate.data || candidate.error) { parsed = candidate; break; }
        } catch { /* Ignore progress text. */ }
      }
    }
    const cliError = parsed?.error && typeof parsed.error === "object" ? parsed.error as JsonObject : null;
    const details = cliError?.details && typeof cliError.details === "object" ? cliError.details as JsonObject : null;
    const nestedErrors = Array.isArray(details?.errors) ? details.errors : [];
    const errors = [...(Array.isArray(parsed?.errors) ? parsed!.errors : []), ...nestedErrors];
    const message = `${String(cliError?.message ?? "")} ${JSON.stringify(errors)} ${result.stderr}`.toLowerCase();
    const retryable = result.code !== 0 && (/throttl|rate limit|temporar|timeout|429|502|503|504/.test(message) || errors.some((item) => JSON.stringify(item).toLowerCase().includes("throttl")));
    if (retryable && attempt < retryLimit) {
      await delay(Math.min(10_000, 500 * 2 ** attempt));
      continue;
    }
    if (result.code !== 0 || !parsed) {
      if (/auth|token|login|credential/.test(message)) {
        throw new Error(`Shopify CLI no tiene una sesión autenticada utilizable para ${store}. Ejecuta: npm run shopify -- store auth --store ${store} --scopes read_products,write_products,read_inventory,write_inventory`);
      }
      const detail = `${String(cliError?.message ?? "")} ${JSON.stringify(errors)}`.trim().slice(0, 400) || result.stderr.trim().slice(0, 400) || "Sin detalle del CLI.";
      throw new Error(`Shopify CLI falló${retryable ? " después de reintentos" : ""}. Revisa la sesión, scopes y conexión del CLI. ${detail}`);
    }
    if (errors.length) throw new Error(`Shopify Admin API devolvió errores GraphQL: ${JSON.stringify(errors).slice(0, 800)}`);
    const data = parsed.data;
    if (!data || typeof data !== "object") throw new Error("Shopify no devolvió datos GraphQL válidos.");
    return data as T;
  }
}

async function readVariants(product: ProductNode) {
  const variants = [...product.variants.nodes];
  let pageInfo = product.variants.pageInfo;
  const query = `query ShippingVariantBackup($productId: ID!, $after: String) {
    product(id: $productId) { variants(first: ${variantPageSize}, after: $after) {
      nodes {
        id title sku barcode price compareAtPrice inventoryQuantity selectedOptions { name value }
        inventoryItem { id tracked requiresShipping measurement { weight { value unit } } }
        metafields(first: 20, namespace: "custom") { nodes { namespace key type value } }
      }
      pageInfo { hasNextPage endCursor }
    } }
  }`;
  while (pageInfo.hasNextPage) {
    const data = await execute<{ product: { variants: { nodes: JsonObject[]; pageInfo: PageInfo } } }>(query, { productId: product.id, after: pageInfo.endCursor });
    variants.push(...data.product.variants.nodes);
    pageInfo = data.product.variants.pageInfo;
    await delay(200);
  }
  return variants;
}

async function collectProducts() {
  const products: Array<JsonObject & { id: string; title: string; variants: JsonObject[] }> = [];
  let after: string | null = null;
  let more = true;
  while (more) {
    const data: { products: { nodes: ProductNode[]; pageInfo: PageInfo } } = await execute(listProductsQuery, { after });
    for (const product of data.products.nodes) {
      products.push({ ...product, variants: await readVariants(product) });
      await delay(100);
    }
    more = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
    await delay(200);
  }
  return products;
}

async function verifyAuthAndScopes() {
  const query = `query ShippingSetupAccessCheck {
    shop { id name }
    currentAppInstallation { accessScopes { handle } }
  }`;
  const data = await execute<{ shop: { name: string }; currentAppInstallation: { accessScopes: Array<{ handle: string }> } }>(query);
  const scopes = new Set(data.currentAppInstallation.accessScopes.map((scope) => scope.handle));
  const missing = ["read_products", "write_products", "read_inventory", "write_inventory"].filter((scope) => !scopes.has(scope));
  if (missing.length) throw new Error(`La sesión CLI está autenticada, pero faltan scopes requeridos: ${missing.join(", ")}. Vuelve a autenticar con esos permisos antes de exportar o escribir.`);
  console.log(`Autenticación Admin verificada para la tienda ${data.shop.name}; scopes de lectura y escritura disponibles.`);
}

async function ensureDimensionDefinitions() {
  const query = `query ShippingDimensionDefinitions {
    metafieldDefinitions(first: 100, ownerType: PRODUCTVARIANT, namespace: "custom") {
      nodes { namespace key type { name } }
    }
  }`;
  const data = await execute<{ metafieldDefinitions: { nodes: Array<{ namespace: string; key: string; type: { name: string } }> } }>(query);
  const definitions = new Map(data.metafieldDefinitions.nodes.map((item) => [item.key, item.type.name]));
  const dimensions = [
    { key: "package_length", name: "Largo del paquete" },
    { key: "package_width", name: "Ancho del paquete" },
    { key: "package_height", name: "Alto del paquete" },
  ];
  const mutation = `mutation CreateShippingDimension($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) { createdDefinition { id key type { name } } userErrors { field message code } }
  }`;
  for (const item of dimensions) {
    const existingType = definitions.get(item.key);
    if (existingType) {
      if (existingType !== "dimension") throw new Error(`custom.${item.key} ya existe con tipo ${existingType}; no se sobrescribió.`);
      continue;
    }
    const result = await execute<{ metafieldDefinitionCreate: { userErrors: Array<{ message: string; code?: string }> } }>(mutation, {
      definition: { name: item.name, namespace: "custom", key: item.key, ownerType: "PRODUCTVARIANT", type: "dimension" },
    }, true);
    const errors = result.metafieldDefinitionCreate.userErrors;
    if (errors.length) throw new Error(`No se pudo crear custom.${item.key}: ${errors.map((error) => error.message).join("; ")}`);
    await delay(250);
  }
}

async function updateProduct(product: JsonObject & { id: string; title: string; variants: JsonObject[] }) {
  const physical = product.variants.filter((variant) => {
    const inventoryItem = variant.inventoryItem as JsonObject | null;
    return inventoryItem?.requiresShipping === true;
  });
  const differing = physical.filter((variant) => {
    const item = variant.inventoryItem as JsonObject;
    const measurement = item.measurement as JsonObject | null;
    const weight = measurement?.weight as JsonObject | null;
    const fields = variant.metafields as { nodes?: Array<{ namespace: string; key: string; value: string }> } | undefined;
    const current = new Map((fields?.nodes ?? []).map((field) => [`${field.namespace}.${field.key}`, field.value]));
    return Number(weight?.value) !== 400 || String(weight?.unit).toUpperCase() !== "GRAMS" || dimensionKeys.some((key) => !isExpectedDimension(current.get(`custom.${key}`)));
  });
  if (!differing.length) return { physical: physical.length, updated: 0 };

  const mutation = `mutation UpdateShippingMeasurements($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants { id inventoryItem { measurement { weight { value unit } } } metafields(first: 3, namespace: "custom") { nodes { key type value } } }
      userErrors { field message code }
    }
  }`;
  let changed = 0;
  for (let start = 0; start < differing.length; start += 250) {
    const batch = differing.slice(start, start + 250).map((variant) => ({
      id: variant.id,
      inventoryItem: { measurement: { weight: { value: 400, unit: "GRAMS" } } },
      metafields: dimensionKeys.map((key) => ({ namespace: "custom", key, type: "dimension", value: JSON.stringify({ value: 20, unit: "centimeters" }) })),
    }));
    const result = await execute<{ productVariantsBulkUpdate: { productVariants: JsonObject[]; userErrors: Array<{ field: string[]; message: string; code?: string }> } }>(mutation, { productId: product.id, variants: batch }, true);
    const payload = result.productVariantsBulkUpdate;
    if (payload.userErrors.length) throw new Error(`${product.title}: ${payload.userErrors.map((error) => error.message).join("; ")}`);
    if (payload.productVariants.length !== batch.length) throw new Error(`${product.title}: Shopify devolvió ${payload.productVariants.length} actualizaciones para un lote de ${batch.length}.`);
    changed += payload.productVariants.length;
    await delay(300);
  }
  return { physical: physical.length, updated: changed };
}

async function main() {
  console.log(`Consultando Shopify Admin ${apiVersion} para ${store}…`);
  await verifyAuthAndScopes();
  const products = await collectProducts();
  const variantCount = products.reduce((sum, product) => sum + product.variants.length, 0);
  const physicalCount = products.reduce((sum, product) => sum + product.variants.filter((variant) => (variant.inventoryItem as JsonObject | null)?.requiresShipping === true).length, 0);
  const backupPath = resolve(`backups/shopify-products-shipping-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await mkdir(dirname(backupPath), { recursive: true });
  await writeFile(backupPath, `${JSON.stringify({ exportedAt: new Date().toISOString(), store, apiVersion, productCount: products.length, variantCount, physicalVariantCount: physicalCount, products }, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(`Respaldo exportado: ${backupPath}`);
  console.log(`Productos: ${products.length}; variantes: ${variantCount}; variantes físicas: ${physicalCount}.`);
  if (exportOnly) {
    console.log("Exportación de solo lectura finalizada; no se cambió Shopify.");
    return;
  }
  if (physicalCount === 0) {
    console.log("No hay variantes físicas que actualizar.");
    return;
  }
  await ensureDimensionDefinitions();
  let updated = 0;
  for (const product of products) {
    const result = await updateProduct(product);
    updated += result.updated;
    if (result.updated) console.log(`Actualizadas ${result.updated} variantes: ${product.title}`);
  }
  console.log("Verificando peso y dimensiones con una nueva lectura paginada…");
  const verification = await collectProducts();
  const physicalVariants = verification.flatMap((product) => product.variants.filter((variant) => (variant.inventoryItem as JsonObject | null)?.requiresShipping === true));
  const invalid = physicalVariants.filter((variant) => {
    const inventory = variant.inventoryItem as JsonObject;
    const measurement = inventory.measurement as JsonObject | null;
    const weight = measurement?.weight as JsonObject | null;
    const fields = variant.metafields as { nodes?: Array<{ namespace: string; key: string; value: string }> } | undefined;
    const values = new Map((fields?.nodes ?? []).map((field) => [`${field.namespace}.${field.key}`, field.value]));
    return Number(weight?.value) !== 400 || String(weight?.unit).toUpperCase() !== "GRAMS" || dimensionKeys.some((key) => !isExpectedDimension(values.get(`custom.${key}`)));
  });
  if (invalid.length) throw new Error(`La verificación final detectó ${invalid.length} variantes físicas sin actualizar correctamente.`);
  console.log(`Verificación aprobada: ${verification.length} productos, ${physicalVariants.length} variantes físicas; peso 400 g y dimensiones 20 × 20 × 20 cm.`);
  console.log(`Variantes actualizadas durante esta ejecución: ${updated}. Shopify no recibió cambios de precio, inventario, SKU, imágenes, descripciones ni opciones.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Error desconocido al configurar el envío en Shopify.");
  process.exitCode = 1;
});
