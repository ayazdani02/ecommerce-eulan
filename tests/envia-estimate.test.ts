import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHILE_COMMUNES,
  addChileBusinessDays,
  chileNationalHolidays,
  deliveryMessage,
  identifyCourier,
  normalizeEnviaCityLocations,
  normalizeEstimate,
  nearestChileCommune,
  parseEstimateDays,
  preparationDelayBusinessDays,
  selectFastestEstimate,
} from "../src/integrations/envia/delivery-estimate";

test("el catálogo de comunas resuelve cada destino a su código de región Envia", () => {
  assert.equal(CHILE_COMMUNES.length, 346);
  assert.deepEqual(CHILE_COMMUNES.find((commune) => commune.id === "CL13101"), {
    id: "CL13101",
    name: "Santiago",
    region: "Metropolitana de Santiago",
    state: "RM",
    latitude: -33.453,
    longitude: -70.654,
  });
  assert.equal(CHILE_COMMUNES.find((commune) => commune.id === "CL05101")?.state, "VS");
  assert.equal(CHILE_COMMUNES.find((commune) => commune.id === "CL08101")?.name, "Concepción");
  assert.equal(CHILE_COMMUNES.find((commune) => commune.id === "CL10101")?.name, "Puerto Montt");
  assert.equal(CHILE_COMMUNES.find((commune) => commune.id === "CL12202")?.name, "Antártica");
});

test("la ubicación se aproxima localmente a la comuna más cercana", () => {
  assert.equal(nearestChileCommune(-33.453, -70.654)?.id, "CL13101");
  assert.equal(nearestChileCommune(Number.NaN, 0), null);
  assert.equal(nearestChileCommune(91, 0), null);
});

test("normaliza el formato real de Geocodes con estado y códigos postales anidados", () => {
  const response = [
    {
      country: { name: "Chile", code: "CL" },
      state: { name: "Valparaíso", code: { "2digit": "VS" } },
      zip_codes: [
        { zip_code: "2340142", locality: "Valparaíso" },
      ],
    },
  ];
  assert.deepEqual(normalizeEnviaCityLocations(response, "Valparaíso"), {
    city: "Valparaíso",
    state: "VS",
    country: "CL",
    zipcode: "2340142",
  });
  assert.equal(normalizeEnviaCityLocations(response, "Santiago"), null);
  assert.equal(normalizeEnviaCityLocations(response, "Valparaíso", "RM"), null);
});

test("interpreta solo los formatos de plazo documentados por Envia", () => {
  assert.deepEqual(parseEstimateDays("Same day"), { min: 0, max: 0 });
  assert.deepEqual(parseEstimateDays("Next day"), { min: 1, max: 1 });
  assert.deepEqual(parseEstimateDays("Día siguiente"), { min: 1, max: 1 });
  assert.deepEqual(parseEstimateDays("1-3 days"), { min: 1, max: 3 });
  assert.deepEqual(parseEstimateDays("1-2 días"), { min: 1, max: 2 });
  assert.deepEqual(parseEstimateDays("3–5 days"), { min: 3, max: 5 });
  assert.equal(parseEstimateDays("about tomorrow"), null);
  assert.equal(parseEstimateDays("3-1 days"), null);
});

test("usa fecha estructurada, preparación, corte y feriados de Chile", () => {
  assert.equal(
    preparationDelayBusinessDays(new Date("2026-10-28T14:00:00.000Z"), "16:00", 4),
    0,
    "cuatro horas desde las 11:00 en Santiago terminan antes del corte",
  );
  assert.equal(
    preparationDelayBusinessDays(new Date("2026-10-28T15:00:00.000Z"), "16:00", 4),
    1,
    "cuatro horas desde las 12:00 en Santiago terminan después del corte",
  );

  const beforeCutoff = new Date("2026-10-28T14:00:00.000Z"); // 11:00 en Santiago
  const exact = normalizeEstimate({
    courier: "starken",
    now: beforeCutoff,
    preparationHours: 0,
    cutoffTime: "16:00",
    rate: {
      deliveryDate: { date: "2026-10-29", dateDifference: 1, timeUnit: "days" },
      deliveryEstimate: "3-5 days",
    },
  });
  assert.equal(exact?.arrivalDate, "2026-10-29");

  const afterCutoffFriday = new Date("2026-10-30T20:00:00.000Z"); // 17:00 en Santiago
  assert.equal(preparationDelayBusinessDays(afterCutoffFriday, "14:00", 0), 1);
  assert.equal(
    normalizeEstimate({
      courier: "chilexpress",
      now: afterCutoffFriday,
      preparationHours: 0,
      cutoffTime: "14:00",
      rate: { deliveryDate: { date: "2026-10-30" } },
    })?.arrivalDate,
    "2026-11-02",
  );

  assert.equal(addChileBusinessDays("2026-04-02", 1), "2026-04-06");
  assert(chileNationalHolidays(2026).has("2026-04-03"));
  assert(chileNationalHolidays(2026).has("2026-06-21"));
  assert(chileNationalHolidays(2027).has("2027-06-28"));
  assert(chileNationalHolidays(2024).has("2024-09-20"));
  assert(chileNationalHolidays(2027).has("2027-09-17"));
  assert(chileNationalHolidays(2023).has("2023-01-02"));
});

test("calcula la fecha desde el rango si el carrier no entrega fecha exacta", () => {
  const beforeCutoff = new Date("2026-10-28T14:00:00.000Z");
  const estimate = normalizeEstimate({
    courier: "blueexpress",
    now: new Date("2026-10-28T14:00:00.000Z"),
    preparationHours: 4,
    cutoffTime: "14:00",
    rate: { deliveryEstimate: "1-3 days" },
  });
  assert.equal(estimate?.arrivalDate, "2026-10-30");
  assert.equal(
    deliveryMessage({ arrivalDate: "2026-10-29" }, beforeCutoff),
    "Llega mañana",
  );
  assert.equal(deliveryMessage({ arrivalDate: "2026-10-30" }, beforeCutoff), "Llega este viernes");
  assert.equal(deliveryMessage({ arrivalDate: "2026-11-12" }, beforeCutoff), "Llega el 12/11");
});

test("selecciona menor plazo e ignora precio; prioridad solo desempata", () => {
  const candidates = [
    { courier: "starken" as const, sortAt: 300 },
    { courier: "blueexpress" as const, sortAt: 200 },
    { courier: "chilexpress" as const, sortAt: 200 },
  ];
  assert.equal(
    selectFastestEstimate(candidates, ["chilexpress", "starken", "blueexpress"])?.courier,
    "chilexpress",
  );
  assert.equal(identifyCourier("BlueExpress") , "blueexpress");
  assert.equal(identifyCourier("Servicio desconocido"), null);
});
