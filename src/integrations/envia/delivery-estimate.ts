import { CHILE_COMMUNES, type ChileCommuneId } from "./chile-communes";

export { CHILE_COMMUNES };
export type { ChileCommuneId };
export type KnownCourierId = "starken" | "blueexpress" | "chilexpress";
export type CourierId = string;

export interface DeliveryEstimate {
  courier: CourierId;
  courierName: string;
  service: string;
  arrivalDate: string;
  arrivalTime?: string;
  cacheExpiresAt: number;
}

export interface RateRecord {
  carrier?: unknown;
  carrierName?: unknown;
  service?: unknown;
  deliveryEstimate?: unknown;
  deliveryDate?: unknown;
}

export interface EnviaCapitalLocation {
  city: string;
  state: string;
  country: "CL";
  zipcode: string;
}

export interface EstimateInput {
  rate: RateRecord;
  courier: CourierId;
  courierName?: string;
  now: Date;
  preparationHours: number;
  cutoffTime: string;
}

export const COURIER_NAMES: Record<KnownCourierId, string> = {
  starken: "Starken",
  blueexpress: "Blue Express",
  chilexpress: "Chilexpress",
};

export function parseEstimateDays(value: unknown): { min: number; max: number } | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  if (normalized === "same day" || normalized === "mismo dia") return { min: 0, max: 0 };
  if (normalized === "next day" || normalized === "dia siguiente") return { min: 1, max: 1 };
  const match = normalized.match(/^(\d+)\s*(?:-|–|to|a)\s*(\d+)\s+(?:days?|dias?)$/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || max < min) {
    return null;
  }
  return { min, max };
}

export function identifyCourier(value: unknown): KnownCourierId | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (normalized.includes("starken")) return "starken";
  if (normalized.includes("blueexpress") || normalized.includes("bluexpress")) {
    return "blueexpress";
  }
  if (normalized.includes("chilexpress")) return "chilexpress";
  return null;
}

export function formatCourierName(value: string) {
  const normalized = value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const knownNames: Record<string, string> = {
    blueexpress: "Blue Express",
    bluexpress: "Blue Express",
    chilexpress: "Chilexpress",
    correoschile: "CorreosChile",
    despachalo: "Despáchalo",
    dhl: "DHL",
    fazt: "FAZT",
    fedex: "FedEx",
    noventa9minutos: "99minutos",
    starken: "Starken",
    welivery: "Welivery",
  };
  return knownNames[normalized] ?? value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocationName(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
    : "";
}

function objectValue(value: unknown) {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function codeValue(value: unknown) {
  if (typeof value === "string") return value;
  const record = objectValue(value);
  if (!record) return "";
  if (typeof record.code === "string") return record.code;
  const stateCode = objectValue(record.code);
  return typeof stateCode?.["2digit"] === "string" ? stateCode["2digit"] : "";
}

export function normalizeEnviaCityLocations(
  response: unknown,
  expectedCity: string,
  expectedState?: string,
): EnviaCapitalLocation | null {
  const wrapped = objectValue(response);
  const candidates = Array.isArray(response)
    ? response
    : Array.isArray(wrapped?.data)
      ? wrapped.data
      : [];
  const expected = normalizeLocationName(expectedCity);
  for (const item of candidates) {
    const location = objectValue(item);
    if (!location) continue;
    const country = codeValue(location.country);
    const state = codeValue(location.state);
    const zipCodes = Array.isArray(location.zip_codes) ? location.zip_codes : [];
    const zipMatch = zipCodes
      .map(objectValue)
      .filter((zip): zip is Record<string, unknown> => zip !== null)
      .find((zip) => normalizeLocationName(zip.locality ?? zip.city) === expected);
    const firstZip = zipMatch ?? zipCodes.map(objectValue).find((zip) => zip !== null);
    const city =
      (typeof location.city === "string" && location.city) ||
      (typeof zipMatch?.locality === "string" && zipMatch.locality) ||
      (typeof zipMatch?.city === "string" && zipMatch.city) ||
      "";
    const postalCode =
      (typeof firstZip?.zip_code === "string" && firstZip.zip_code) ||
      (typeof firstZip?.zipcode === "string" && firstZip.zipcode) ||
      (typeof location.zipcode === "string" && location.zipcode) ||
      (typeof location.postalCode === "string" && location.postalCode) ||
      "";
    if (
      city && normalizeLocationName(city) === expected && /^[A-Z]{2}$/.test(state) && postalCode && country === "CL"
    ) {
      if (expectedState && state !== expectedState) continue;
      return { city, state, country: "CL", zipcode: postalCode };
    }
  }
  return null;
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function localTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function juneSolsticeDate(year: number) {
  // Meeus approximation for the June solstice (error below a minute in this era).
  const y = (year - 2000) / 1000;
  const julianDay =
    2451716.56767 +
    365241.62603 * y +
    0.00325 * y ** 2 +
    0.00888 * y ** 3 -
    0.0003 * y ** 4;
  return dateKey(new Date((julianDay - 2440587.5) * 86_400_000));
}

function shiftedMonday(month: number, day: number, year: number) {
  const original = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = original.getUTCDay();
  if (weekday >= 2 && weekday <= 4) {
    original.setUTCDate(original.getUTCDate() - weekday + 1);
  } else if (weekday === 5) {
    original.setUTCDate(original.getUTCDate() + 3);
  }
  return dateKey(original);
}

export function chileNationalHolidays(year: number) {
  const fixed = [
    `${year}-01-01`,
    `${year}-05-01`,
    `${year}-05-21`,
    `${year}-07-16`,
    `${year}-08-15`,
    `${year}-09-18`,
    `${year}-09-19`,
    `${year}-10-31`,
    `${year}-11-01`,
    `${year}-12-08`,
    `${year}-12-25`,
    juneSolsticeDate(year),
  ];
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(goodFriday.getUTCDate() - 2);
  const holySaturday = new Date(easter);
  holySaturday.setUTCDate(holySaturday.getUTCDate() - 1);
  const additional = [];
  if (new Date(Date.UTC(year, 0, 1, 12)).getUTCDay() === 0) {
    additional.push(`${year}-01-02`);
  }
  const independenceWeekday = new Date(Date.UTC(year, 8, 18, 12)).getUTCDay();
  if (independenceWeekday === 2) additional.push(`${year}-09-17`);
  if (independenceWeekday === 3) additional.push(`${year}-09-20`);
  if (
    independenceWeekday === 6 &&
    new Date(Date.UTC(year, 8, 19, 12)).getUTCDay() === 0
  ) {
    additional.push(`${year}-09-17`);
  }
  return new Set([
    ...fixed,
    ...additional,
    dateKey(goodFriday),
    dateKey(holySaturday),
    shiftedMonday(6, 29, year),
    shiftedMonday(10, 12, year),
  ]);
}

export function isChileBusinessDay(key: string) {
  const date = dateFromKey(key);
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6 && !chileNationalHolidays(date.getUTCFullYear()).has(key);
}

export function addChileBusinessDays(key: string, count: number) {
  const date = dateFromKey(key);
  let remaining = Math.max(0, Math.floor(count));
  let inspected = 0;
  while (remaining > 0 && inspected < 370) {
    date.setUTCDate(date.getUTCDate() + 1);
    const current = dateKey(date);
    if (isChileBusinessDay(current)) remaining -= 1;
    inspected += 1;
  }
  return dateKey(date);
}

export function preparationDelayBusinessDays(
  now: Date,
  cutoffTime: string,
  preparationHours: number,
) {
  const today = dateKey(now);
  if (!isChileBusinessDay(today) || localTime(now) >= cutoffTime) {
    return 1;
  }

  const readyAt = new Date(now.getTime() + preparationHours * 60 * 60 * 1000);
  const readyDate = dateKey(readyAt);
  const dispatchDate =
    isChileBusinessDay(readyDate) && localTime(readyAt) < cutoffTime
      ? readyDate
      : addChileBusinessDays(readyDate, 1);
  let delay = 0;
  let cursor = today;
  while (cursor < dispatchDate && delay < 370) {
    cursor = addChileBusinessDays(cursor, 1);
    delay += 1;
  }
  return delay;
}

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeEstimate(input: EstimateInput) {
  const deliveryDate = input.rate.deliveryDate;
  const structured =
    deliveryDate && typeof deliveryDate === "object"
      ? (deliveryDate as Record<string, unknown>)
      : null;
  const preparationDelay = preparationDelayBusinessDays(
    input.now,
    input.cutoffTime,
    input.preparationHours,
  );

  if (structured && validIsoDate(structured.date)) {
    if (structured.date < dateKey(input.now)) return null;
    const arrivalDate = addChileBusinessDays(structured.date, preparationDelay);
    return {
      courier: input.courier,
      courierName: input.courierName ?? COURIER_NAMES[input.courier as KnownCourierId] ?? formatCourierName(input.courier),
      service: typeof input.rate.service === "string" ? input.rate.service : "",
      arrivalDate,
      arrivalTime: typeof structured.time === "string" ? structured.time : undefined,
      sortAt: (() => {
        const [year, month, day] = arrivalDate.split("-").map(Number);
        const [hour, minute] =
          typeof structured.time === "string" && /^\d{2}:\d{2}$/.test(structured.time)
            ? structured.time.split(":").map(Number)
            : [23, 59];
        return Date.UTC(year, month - 1, day, hour, minute);
      })(),
    };
  }

  const estimate = parseEstimateDays(input.rate.deliveryEstimate);
  if (estimate) {
    const arrivalDate = addChileBusinessDays(
      addChileBusinessDays(dateKey(input.now), estimate.min),
      preparationDelay,
    );
    const [year, month, day] = arrivalDate.split("-").map(Number);
    return {
      courier: input.courier,
      courierName: input.courierName ?? COURIER_NAMES[input.courier as KnownCourierId] ?? formatCourierName(input.courier),
      service: typeof input.rate.service === "string" ? input.rate.service : "",
      arrivalDate,
      arrivalTime: undefined,
      sortAt: Date.UTC(year, month - 1, day, 23, 59),
    };
  }

  return null;
}

export function selectFastestEstimate<T extends { courier: CourierId; sortAt: number }>(
  estimates: T[],
  priority: CourierId[],
) {
  const rank = new Map(priority.map((courier, index) => [courier, index]));
  return [...estimates].sort(
    (a, b) => a.sortAt - b.sortAt || (rank.get(a.courier) ?? 999) - (rank.get(b.courier) ?? 999),
  )[0] ?? null;
}

export function deliveryMessage(
  estimate: Pick<DeliveryEstimate, "arrivalDate">,
  now = new Date(),
) {
  const todayKey = dateKey(now);
  const today = dateFromKey(todayKey);
  const arrival = dateFromKey(estimate.arrivalDate);
  const dayDifference = Math.round((arrival.getTime() - today.getTime()) / 86_400_000);
  if (dayDifference <= 0) return "Llega hoy";
  if (dayDifference === 1) return "Llega mañana";

  const weekStart = (date: Date) => {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    return dateKey(date);
  };
  if (weekStart(new Date(today)) === weekStart(new Date(arrival))) {
    const weekday = new Intl.DateTimeFormat("es-CL", {
      timeZone: "UTC",
      weekday: "long",
    }).format(arrival);
    return `Llega este ${weekday}`;
  }

  const day = String(arrival.getUTCDate()).padStart(2, "0");
  const month = String(arrival.getUTCMonth() + 1).padStart(2, "0");
  return `Llega el ${day}/${month}`;
}

export function isChileCommuneId(value: unknown): value is ChileCommuneId {
  return typeof value === "string" && CHILE_COMMUNES.some((commune) => commune.id === value);
}

export function nearestChileCommune(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  let nearest: (typeof CHILE_COMMUNES)[number] | null = null;
  let shortestDistance = Number.POSITIVE_INFINITY;
  for (const commune of CHILE_COMMUNES) {
    if (!("latitude" in commune) || !("longitude" in commune)) continue;
    const lat = commune.latitude;
    const lon = commune.longitude;
    if (typeof lat !== "number" || typeof lon !== "number") continue;
    const lat1 = (latitude * Math.PI) / 180;
    const lat2 = (lat * Math.PI) / 180;
    const deltaLat = ((lat - latitude) * Math.PI) / 180;
    const deltaLon = ((lon - longitude) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const distance = 6_371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = commune;
    }
  }
  return nearest;
}
