import { test } from "node:test";
import assert from "node:assert/strict";
import { mockProvider, mockProducts } from "../src/commerce/adapters/mock";
import { filterProducts, formatMoney } from "../src/commerce/catalog";
test("catálogo filtra por categoría, acabado, disponibilidad y búsqueda sin tildes", async () => {
  assert.equal(
    (await mockProvider.getProducts({ query: "lagrima" }))[0].slug,
    "aro-lagrima",
  );
  assert.equal(
    (await mockProvider.getProducts({ category: "collares" })).length,
    2,
  );
  assert.equal(
    (await mockProvider.getProducts({ finish: "Dorado suave" })).length,
    1,
  );
  assert.equal((await mockProvider.getProducts({ available: true })).length, 5);
  assert.equal(
    (await mockProvider.getProducts({ query: "no existe" })).length,
    0,
  );
  const ordered = filterProducts(mockProducts, { sort: "precio-asc" });
  assert.equal(ordered[0].slug, "aro-colgante");
  assert.match(formatMoney({ amount: 24990, currency: "CLP" }), /24\.990/);
});
test("carrito persiste variantes separadas y recalcula subtotal desde catálogo", async () => {
  let cart = await mockProvider.mutateCart(undefined, {
    type: "add",
    variantId: "aro-volumen-0",
    quantity: 2,
  });
  cart = await mockProvider.mutateCart(cart.id, {
    type: "add",
    variantId: "aro-volumen-1",
    quantity: 1,
  });
  assert.equal(cart.lines.length, 2);
  assert.equal(cart.totalQuantity, 3);
  assert.equal(cart.subtotal.amount, 74970);
  const restored = await mockProvider.getCart(cart.id);
  assert.equal(restored.subtotal.amount, 74970);
  cart = await mockProvider.mutateCart(cart.id, {
    type: "update",
    lineId: "aro-volumen-0",
    quantity: 1,
  });
  assert.equal(cart.subtotal.amount, 49980);
  cart = await mockProvider.mutateCart(cart.id, {
    type: "remove",
    lineId: "aro-volumen-1",
  });
  assert.equal(cart.lines.length, 1);
  cart = await mockProvider.mutateCart(cart.id, {
    type: "update",
    lineId: "aro-volumen-0",
    quantity: 0,
  });
  assert.equal(cart.totalQuantity, 0);
});
test("rechaza stock excedido o no disponible y nunca permite cobros en mock", async () => {
  await assert.rejects(() =>
    mockProvider.mutateCart(undefined, {
      type: "add",
      variantId: "aros-curva-0",
      quantity: 1,
    }),
  );
  await assert.rejects(() =>
    mockProvider.mutateCart(undefined, {
      type: "add",
      variantId: "aro-volumen-0",
      quantity: 9,
    }),
  );
  assert.equal((await mockProvider.checkout("test")).type, "unavailable");
  assert.equal((await mockProvider.getCart("invalid-cookie")).lines.length, 0);
  const forged = Buffer.from(
    JSON.stringify([{ variantId: "aro-volumen-0", quantity: 99999 }]),
  ).toString("base64url");
  assert.equal((await mockProvider.getCart(forged)).totalQuantity, 0);
});
