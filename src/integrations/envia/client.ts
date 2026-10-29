import "server-only";
import { createHash } from "node:crypto";
import {
  CHILE_COMMUNES,
  normalizeEnviaCityLocations,
  type ChileCommuneId,
  type CourierId,
  type DeliveryEstimate,
  type EnviaCapitalLocation,
  identifyCourier,
  normalizeEstimate,
} from "./delivery-estimate";

const ENVIA_API = "https://api.envia.com";
const ENVIA_QUERIES = "https://queries.envia.com";
const ENVIA_GEOCODES = "https://geocodes.envia.com";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_CACHE_TTL_SECONDS = 6 * 60 * 60;
const COURIER_PRIORITY_DEFAULT: CourierId[] = [
  "starken",
  "blueexpress",
  "chilexpress",
];

interface EnviaCarrier {
  name?: unknown;
  carrier?: unknown;
  description?: unknown;
  active?: unknown;
}

interface CachedValue<T> {
  expiresAt: number;
  promise: Promise<T>;
}

type CacheStore = {
  values: Map<string, CachedValue<DeliveryEstimate[] | null>>;
  carriers: Map<string, CachedValue<EnviaCarrier[]>>;
  locations: Map<string, CachedValue<EnviaCapitalLocation>>;
};

const cacheStore = (): CacheStore => {
  const root = globalThis as typeof globalThis & { __eulanEnviaCache?: CacheStore };
  root.__eulanEnviaCache ??= {
    values: new Map(),
    carriers: new Map(),
    locations: new Map(),
  };
  return root.__eulanEnviaCache;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function requiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`missing_${key.toLowerCase()}`);
  return value;
}

function parseIntEnv(key: string, fallback?: number) {
  const raw = process.env[key]?.trim();
  if (!raw && fallback !== undefined) return fallback;
  if (!raw || !/^\d+$/.test(raw)) throw new Error(`invalid_${key.toLowerCase()}`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) throw new Error(`invalid_${key.toLowerCase()}`);
  return value;
}

function configuration() {
  const token = requiredEnv("ENVIA_TOKEN");
  const origin = {
    name: requiredEnv("ENVIA_ORIGIN_NAME"),
    phone: requiredEnv("ENVIA_ORIGIN_PHONE"),
    street: requiredEnv("ENVIA_ORIGIN_STREET"),
    number: requiredEnv("ENVIA_ORIGIN_NUMBER"),
    city: requiredEnv("ENVIA_ORIGIN_CITY"),
    state: requiredEnv("ENVIA_ORIGIN_STATE").toUpperCase(),
    country: "CL" as const,
    postalCode: requiredEnv("ENVIA_ORIGIN_POSTAL_CODE"),
  };
  if (!/^[A-Z]{2}$/.test(origin.state)) throw new Error("invalid_envia_origin_state");
  const preparationHours = parseIntEnv("ENVIA_PREPARATION_HOURS");
  if (preparationHours > 24) throw new Error("invalid_envia_preparation_hours");
  const cutoffTime = requiredEnv("ENVIA_CUTOFF_TIME");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cutoffTime)) {
    throw new Error("invalid_envia_cutoff_time");
  }
  const cacheTtlSeconds = Math.max(
    60,
    Math.min(parseIntEnv("ENVIA_CACHE_TTL_SECONDS", DEFAULT_CACHE_TTL_SECONDS), 86_400),
  );
  const priorityRaw = process.env.ENVIA_COURIER_PRIORITY?.trim();
  const priority = priorityRaw
    ? priorityRaw
        .split(",")
        .map((value) => identifyCourier(value.trim()))
        .filter((value): value is CourierId => value !== null)
    : COURIER_PRIORITY_DEFAULT;
  const uniquePriority = [...new Set(priority)];
  for (const courier of COURIER_PRIORITY_DEFAULT) {
    if (!uniquePriority.includes(courier)) uniquePriority.push(courier);
  }
  const pkg = {
    content: process.env.ENVIA_PACKAGE_CONTENT?.trim() || "Joyería",
    length: parseIntEnv("ENVIA_PACKAGE_LENGTH_CM", 20),
    width: parseIntEnv("ENVIA_PACKAGE_WIDTH_CM", 20),
    height: parseIntEnv("ENVIA_PACKAGE_HEIGHT_CM", 20),
    weight: Number(process.env.ENVIA_PACKAGE_WEIGHT_KG ?? "0.4"),
    amount: parseIntEnv("ENVIA_PACKAGE_AMOUNT", 1),
  };
  const numericPackageValues = [
    pkg.length,
    pkg.width,
    pkg.height,
    pkg.weight,
    pkg.amount,
  ];
  if (
    numericPackageValues.some((value) => !Number.isFinite(value) || value <= 0) ||
    !Number.isInteger(pkg.amount)
  ) {
    throw new Error("invalid_envia_package");
  }
  return {
    token,
    origin,
    preparationHours,
    cutoffTime,
    cacheTtlSeconds,
    priority: uniquePriority,
    pkg,
  };
}

async function getJson(url: string, token?: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || isApiError(body)) {
    throw new Error(`envia_http_${response.status}_api_${upstreamErrorCode(body)}`);
  }
  return body;
}

async function postJson(url: string, token: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok || isApiError(body)) {
    throw new Error(`envia_http_${response.status}_api_${upstreamErrorCode(body)}`);
  }
  return body;
}

function isApiError(value: unknown) {
  return (
    value !== null &&
    typeof value === "object" &&
    "meta" in value &&
    (value as { meta?: unknown }).meta === "error"
  );
}

function upstreamErrorCode(value: unknown) {
  if (!value || typeof value !== "object" || !("error" in value)) return "none";
  const error = (value as { error?: unknown }).error;
  if (!error || typeof error !== "object" || !("code" in error)) return "unknown";
  const code = (error as { code?: unknown }).code;
  const codeText = typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
  const message = "message" in error && typeof error.message === "string"
    ? error.message.toLowerCase()
    : "";
  const field = message.match(/\b(origin|destination|packages|shipment)\.[a-z_.]+\b/)?.[0];
  const missingProperty = message.match(/required_property_missing_([a-z0-9]+)/)?.[1];
  const issue = /required/.test(message)
    ? "required"
    : /invalid/.test(message)
      ? "invalid"
      : /not found|unavailable|unsupported/.test(message)
        ? "unavailable"
        : "rejected";
  if (missingProperty) return `${codeText}_required_${missingProperty}`;
  return `${codeText}_${field ? `${field}_` : ""}${issue}`;
}

function cached<T>(
  map: Map<string, CachedValue<T>>,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
) {
  const existing = map.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.promise;
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const promise = load().catch((error: unknown) => {
    map.delete(key);
    throw error;
  });
  map.set(key, { expiresAt, promise });
  return promise;
}

async function locationForCity(city: string, state: string, ttlSeconds: number) {
  const map = cacheStore().locations;
  return cached(map, `${city.toLowerCase()}:${state}`, ttlSeconds, async () => {
    const data: unknown = await getJson(
      `${ENVIA_GEOCODES}/locate/CL/${encodeURIComponent(city)}`,
    );
    const match = normalizeEnviaCityLocations(data, city, state);
    if (!match) throw new Error("envia_city_not_found");
    return match;
  });
}

async function activeCarriers(token: string, ttlSeconds: number) {
  const credentialHash = hash(token);
  const map = cacheStore().carriers;
  return cached(map, credentialHash, ttlSeconds, async () => {
    const data: unknown = await getJson(
      `${ENVIA_QUERIES}/carrier?country_code=CL`,
      token,
    );
    const carriers =
      data && typeof data === "object" && "data" in data
        ? (data as { data?: unknown }).data
        : null;
    if (!Array.isArray(carriers)) throw new Error("envia_carriers_unavailable");
    return carriers.filter(
      (item): item is EnviaCarrier =>
        !!item &&
        typeof item === "object" &&
        (item as EnviaCarrier).active !== false &&
        (typeof (item as EnviaCarrier).name === "string" ||
          typeof (item as EnviaCarrier).carrier === "string"),
    );
  });
}

function rateRecords(value: unknown): unknown[] {
  if (!value || typeof value !== "object" || !("data" in value)) return [];
  const data = (value as { data?: unknown }).data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested : [];
  }
  return [];
}

function carrierIdentifier(carrier: EnviaCarrier) {
  const exact = typeof carrier.name === "string" ? carrier.name : carrier.carrier;
  return typeof exact === "string" ? exact : null;
}

function isActiveForCourier(carrier: EnviaCarrier, courier: CourierId) {
  return identifyCourier(
    `${typeof carrier.name === "string" ? carrier.name : ""} ${typeof carrier.carrier === "string" ? carrier.carrier : ""} ${typeof carrier.description === "string" ? carrier.description : ""}`,
  ) === courier;
}

function rateRequest(config: ReturnType<typeof configuration>, destination: EnviaCapitalLocation, carrier: string) {
  return {
    origin: config.origin,
    destination: {
      city: destination.city,
      state: destination.state,
      country: "CL",
      postalCode: destination.zipcode,
    },
    packages: [
      {
        type: "box",
        content: config.pkg.content,
        amount: config.pkg.amount,
        weight: config.pkg.weight,
        weightUnit: "KG",
        lengthUnit: "CM",
        dimensions: {
          length: config.pkg.length,
          width: config.pkg.width,
          height: config.pkg.height,
        },
      },
    ],
    shipment: { type: 1, carrier },
  };
}

async function quoteCommune(communeId: ChileCommuneId, config: ReturnType<typeof configuration>) {
  const commune = CHILE_COMMUNES.find((candidate) => candidate.id === communeId);
  if (!commune) throw new Error("invalid_commune");
  const [destination, carriers] = await Promise.all([
    locationForCity(commune.name, commune.state, config.cacheTtlSeconds),
    activeCarriers(config.token, config.cacheTtlSeconds),
  ]);
  const selectedCarriers = COURIER_PRIORITY_DEFAULT.flatMap((courier) => {
    const match = carriers.find((carrier) => isActiveForCourier(carrier, courier));
    const identifier = match && carrierIdentifier(match);
    return match && identifier ? [{ courier, identifier }] : [];
  });
  if (!selectedCarriers.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[envia-estimate] No supported active carriers matched", {
        availableCarriers: carriers.map(carrierIdentifier).filter(Boolean),
      });
    }
    return null;
  }

  const rates = await Promise.all(
    selectedCarriers.map(async ({ courier, identifier }) => {
      try {
        const response = await postJson(
          `${ENVIA_API}/ship/rate/`,
          config.token,
          rateRequest(config, destination, identifier),
        );
        return rateRecords(response).flatMap((record) => {
          if (!record || typeof record !== "object") return [];
          const rate = record as Record<string, unknown>;
          const returnedCourier = identifyCourier(rate.carrier);
          if (returnedCourier && returnedCourier !== courier) return [];
          if (typeof rate.service !== "string" || !rate.service.trim()) return [];
          return [
            {
              courier,
              carrier: rate.carrier,
              service: rate.service,
              deliveryEstimate: rate.deliveryEstimate,
              deliveryDate: rate.deliveryDate,
            },
          ];
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          const detail =
            error instanceof Error && /^envia_http_\d+_api_[\w.[\]-]+$/.test(error.message)
              ? error.message
              : error instanceof Error
                ? error.name
                : "unknown";
          console.warn("[envia-estimate] Carrier rate request failed", { courier, detail });
        }
        return [];
      }
    }),
  );
  const now = new Date();
  const estimates = rates.flatMap((records) =>
    records.flatMap((record) => {
      const courier = record.courier as CourierId;
      const normalized = normalizeEstimate({
        rate: {
          carrier: record.carrier,
          service: record.service,
          deliveryEstimate: record.deliveryEstimate,
          deliveryDate: record.deliveryDate,
        },
        courier,
        now,
        preparationHours: config.preparationHours,
        cutoffTime: config.cutoffTime,
      });
      return normalized ? [normalized] : [];
    }),
  );
  const priorityRank = new Map(config.priority.map((courier, index) => [courier, index]));
  const orderedEstimates = estimates.sort(
    (a, b) =>
      a.sortAt - b.sortAt ||
      (priorityRank.get(a.courier) ?? 999) - (priorityRank.get(b.courier) ?? 999),
  );
  if (!orderedEstimates.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[envia-estimate] No usable delivery estimate returned", {
        matchedCarriers: selectedCarriers.map(({ courier }) => courier),
        rateRecords: rates.reduce((count, records) => count + records.length, 0),
      });
    }
    return null;
  }
  return orderedEstimates.map((estimate) => ({
    courier: estimate.courier,
    courierName: estimate.courierName,
    service: estimate.service,
    arrivalDate: estimate.arrivalDate,
    arrivalTime: estimate.arrivalTime,
  }));
}

export async function getDeliveryOptions(communeId: string) {
  if (!CHILE_COMMUNES.some((commune) => commune.id === communeId)) return null;
  const config = configuration();
  const key = hash(
    JSON.stringify({
      communeId,
      origin: config.origin,
      package: config.pkg,
      preparationHours: config.preparationHours,
      cutoffTime: config.cutoffTime,
      courierPriority: config.priority,
      account: hash(config.token),
    }),
  );
  const map = cacheStore().values;
  const now = Date.now();
  const existing = map.get(key);
  if (existing && existing.expiresAt > now) return existing.promise;
  const pending = quoteCommune(communeId as ChileCommuneId, config);
  const promise = pending
    .then((value) => {
      if (!value?.length) {
        // An empty carrier response can be transient; leave later attempts free to retry Envia.
        map.delete(key);
        return null;
      }
      const expiresAt = Date.now() + config.cacheTtlSeconds * 1000;
      const result = value.map((estimate) => ({ ...estimate, cacheExpiresAt: expiresAt }));
      map.set(key, { expiresAt, promise: Promise.resolve(result) });
      return result;
    })
    .catch((error: unknown) => {
      map.delete(key);
      throw error;
    });
  map.set(key, {
    expiresAt: Date.now() + config.cacheTtlSeconds * 1000,
    promise,
  });
  return promise;
}

export async function getDeliveryEstimate(communeId: string) {
  return (await getDeliveryOptions(communeId))?.[0] ?? null;
}
