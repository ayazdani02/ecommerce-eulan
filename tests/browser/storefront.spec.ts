import { test, expect } from "@playwright/test";
test("Home, escenas, menú y navegación", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Waterproof. Todo el día.",
  );
  await page
    .getByRole("button", { name: "Mostrar escena: Detalle del producto" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Livianos. Cómodos." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver toda la colección" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Mostrar escena: Campaña" }).click();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(page.getByRole("dialog", { name: "Menú" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Menú" })).not.toBeVisible();
  }
  await page.getByRole("link", { name: "Ver toda la colección" }).click();
  await expect(page).toHaveURL(/catalogo/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("filtros, orden y búsqueda vacía", async ({ page }) => {
  await page.goto("/catalogo");
  await expect(page.locator(".store-grid>.product-card")).toHaveCount(6);
  await page
    .getByRole("combobox", { name: "Categoría", exact: true })
    .selectOption("collares");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.locator(".store-grid>.product-card")).toHaveCount(2);
  await page.getByLabel("Ordenar por").selectOption("precio-asc");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.locator(".product-title").first()).toHaveText(
    "Collar Gota",
  );
  await page.goto("/buscar?q=sin-resultados");
  await expect(
    page.getByRole("heading", {
      name: "No encontramos piezas con esos filtros.",
    }),
  ).toBeVisible();
  await page.goto("/buscar?q=lagrima");
  await expect(page.locator(".store-grid>.product-card")).toHaveCount(1);
});
test("variantes, carrito persistente, cantidades, demo y eliminación", async ({
  page,
}) => {
  await page.goto("/productos/aro-volumen");
  await page.getByRole("button", { name: "Dorado suave", exact: true }).click();
  await page.getByRole("button", { name: "Añadir al carrito" }).click();
  const drawer = page.getByRole("dialog", { name: "Tu carrito" });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText("Dorado suave");
  await expect(drawer).toContainText("$24.990");
  await drawer
    .getByRole("button", { name: "Agregar una unidad de Aro Volumen" })
    .click();
  await expect(drawer).toContainText("$49.980");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Añadir al carrito" }),
  ).toBeFocused();
  await page.goto("/carrito");
  await expect(page.locator(".cart-page")).toContainText("$49.980");
  await page
    .getByRole("button", { name: "Consultar checkout de demostración" })
    .click();
  await expect(page.locator(".cart-page").getByRole("alert")).toContainText(
    "Modo demostración",
  );
  await page.getByRole("button", { name: "Eliminar Aro Volumen" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu carrito está vacío." }),
  ).toBeVisible();
  await page.goto("/productos/aros-curva");
  await expect(
    page.getByRole("button", { name: "Agotado", exact: true }),
  ).toBeDisabled();
});
test("rutas editoriales, contacto, 404 y coherencia responsive", async ({
  page,
}, testInfo) => {
  for (const route of [
    "/colecciones/aros",
    "/productos/collar-gota",
    "/sobre-eulan",
    "/envios",
    "/cambios-y-devoluciones",
    "/cuidados",
    "/preguntas-frecuentes",
    "/privacidad",
    "/terminos",
    "/contacto",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toHaveCount(1);
    if (route === "/colecciones/aros" && testInfo.project.name === "desktop") {
      await expect(page.getByRole("navigation", { name: "Principal", exact: true }).getByRole("link", { name: "AROS", exact: true })).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.getByLabel("Tu nombre").fill("Cliente de prueba");
  await page.getByLabel("Correo electrónico").fill("prueba@example.com");
  await page
    .getByLabel("Mensaje", { exact: true })
    .fill("Consulta de prueba del formulario.");
  await page.getByRole("button", { name: "Preparar correo" }).click();
  await expect(page.getByRole("status")).toContainText("no se ha enviado");
  await page.goto("/ruta-inexistente");
  await expect(
    page.getByRole("heading", { name: "Esta pieza del camino no está aquí." }),
  ).toBeVisible();
  for (const [route, name] of [
    ["/catalogo", "catalogo"],
    ["/colecciones/aros", "coleccion"],
    ["/productos/aro-volumen", "producto"],
  ]) {
    await page.goto(route);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const image of document.images) image.loading = "eager";
      await Promise.all(
        [...document.images].map((i) => i.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: `docs/verification/${name}-${testInfo.project.name}.png`,
      fullPage: true,
    });
  }
});
test("API valida origen, cantidades y stock", async ({ request, baseURL }) => {
  const cross = await request.post("/api/cart", {
    headers: { Origin: "https://example.com" },
    data: { type: "add", variantId: "aro-volumen-0", quantity: 1 },
  });
  expect(cross.status()).toBe(403);
  const invalid = await request.post("/api/cart", {
    headers: { Origin: baseURL! },
    data: { type: "add", variantId: "aro-volumen-0", quantity: -1 },
  });
  expect(invalid.status()).toBe(400);
  const stock = await request.post("/api/cart", {
    headers: { Origin: baseURL! },
    data: { type: "add", variantId: "aro-volumen-0", quantity: 9 },
  });
  expect(stock.status()).toBe(400);
});

test('miniatura sincroniza avance, pausa y siguiente escena', async ({ page }) => {
  await page.goto('/');
  const bars = page.locator('[data-hero-carousel]:visible').locator('.hero-clock-fill');
  await expect(page.locator('.hero-scene-progress')).toHaveCount(0);
  await expect(bars.first()).toHaveCSS('stroke-width', '1.5px');
  await expect.poll(() => bars.first().evaluate(el => el.getAnimations().length)).toBe(1);
  await expect.poll(() => bars.first().evaluate(el => Number(el.getAnimations()[0]?.currentTime ?? 0))).toBeGreaterThan(150);
  const active = page.locator('[data-hero-scene][aria-pressed="true"]:visible');
  await expect(active).toHaveAttribute('data-hero-scene', '0');
  const halfway = await bars.first().evaluate(el => {
    const animation = el.getAnimations()[0];
    animation.currentTime = 5000;
    const ring = el as SVGRectElement;
    const ratio = parseFloat(getComputedStyle(ring).strokeDashoffset) / ring.getTotalLength();
    const box = ring.getBBox();
    return {ratio, x: box.x, y: box.y};
  });
  expect(halfway.ratio).toBeCloseTo(0.5, 2);
  expect(halfway.x).toBe(2);
  expect(halfway.y).toBe(2);
  await expect(active).toHaveAttribute('data-hero-scene', '0');
  // Adelantar el reloj visual cerca del límite permite verificar el cambio real
  // sin esperar diez segundos en cada viewport.
  await bars.first().evaluate(el => { const animation = el.getAnimations()[0]; animation.currentTime = 9850; });
  await expect(active).toHaveAttribute('data-hero-scene', '1');
  const second = bars.nth(1);
  await expect.poll(() => second.evaluate(el => Number(el.getAnimations()[0]?.currentTime ?? 0))).toBeGreaterThan(100);
  await page.getByRole('button', {name: 'Pausar cambio automático de escenas'}).click();
  await second.evaluate(async el => { await el.getAnimations()[0].ready; });
  const stopped = await second.evaluate(el => Number(el.getAnimations()[0].currentTime));
  await expect.poll(() => second.evaluate(el => el.getAnimations()[0].playState)).toBe('paused');
  await page.waitForTimeout(180);
  expect(await second.evaluate(el => Number(el.getAnimations()[0].currentTime))).toBe(stopped);
  await page.getByRole('button', {name: 'Reanudar cambio automático de escenas'}).click();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(0, 0);
  await page.mouse.move(0, 899);
  await expect.poll(() => second.evaluate(el => Number(el.getAnimations()[0].currentTime))).toBeGreaterThan(stopped);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect.poll(() => second.evaluate(el => el.getAnimations()[0].playState)).toBe('paused');
});
