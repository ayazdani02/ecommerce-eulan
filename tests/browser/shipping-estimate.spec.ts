import { expect, test } from "@playwright/test";

test("estimador parte de Santiago, busca comunas y detecta la más cercana", async ({ page }) => {
  const requestedCommunes: string[] = [];
  await page.route("**/api/shipping-estimate", async (route) => {
    const body = route.request().postDataJSON() as { communeId?: string };
    requestedCommunes.push(body.communeId ?? "");
    await new Promise((resolve) => setTimeout(resolve, 180));
    const courier = body.communeId === "CL05101" ? "starken" : "chilexpress";
    const courierName = courier === "starken" ? "Starken" : "Chilexpress";
    const arrivalDate = new Date(Date.now() + 1 * 86_400_000).toISOString().slice(0, 10);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        estimate: {
          courier,
          courierName,
          service: "servicio de prueba del navegador",
          arrivalDate,
          cacheExpiresAt: Date.now() + 60_000,
        },
      }),
    });
  });

  await page.goto("/productos/prueba-aro-volumen");
  const estimator = page.locator(".delivery-estimator");
  const input = estimator.getByRole("combobox", { name: "Comuna de entrega" });
  const result = estimator.getByRole("status");
  await expect(result).toContainText("Llega mañana");
  await expect(estimator.getByRole("img", { name: "Chilexpress" })).toBeVisible();
  await expect(input).toHaveValue("Santiago");

  await input.click();
  await input.fill("Valparaíso");
  await expect(estimator.getByRole("option").first()).toContainText("Valparaíso");
  await estimator.getByRole("option").filter({ hasText: "Valparaíso" }).first().click();
  await expect(result).toHaveText("Consultando plazo…");
  await expect(result).toContainText("Llega mañana");
  await expect(estimator.getByRole("img", { name: "Starken" })).toBeVisible();

  await input.click();
  await input.fill("Concepción");
  await estimator.getByRole("option", { name: /Concepción/ }).click();
  await expect(estimator.getByRole("img", { name: "Chilexpress" })).toBeVisible();
  await page.context().grantPermissions(["geolocation"], { origin: "http://localhost:3000" });
  await page.context().setGeolocation({ latitude: -33.453, longitude: -70.654 });
  await input.click();
  await estimator.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(input).toHaveValue("Santiago");
  expect(requestedCommunes).toEqual(["CL13101", "CL05101", "CL08101", "CL13101"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
