import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Cart, CartAction } from "./models";
export const CART_COOKIE = `eulan-cart-${process.env.COMMERCE_PROVIDER ?? "mock"}`;
export async function cartId() {
  return (await cookies()).get(CART_COOKIE)?.value;
}
export function cartResponse(cart: Cart) {
  const response = NextResponse.json(cart, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
export function parseAction(value: unknown): CartAction {
  if (!value || typeof value !== "object")
    throw new Error("Solicitud inválida.");
  const v = value as Record<string, unknown>;
  if (
    v.type === "add" &&
    typeof v.variantId === "string" &&
    v.variantId.length <= 250 &&
    validQuantity(v.quantity, 1)
  )
    return {
      type: "add",
      variantId: v.variantId,
      quantity: v.quantity as number,
    };
  if (
    v.type === "update" &&
    typeof v.lineId === "string" &&
    v.lineId.length <= 250 &&
    validQuantity(v.quantity, 0)
  )
    return { type: "update", lineId: v.lineId, quantity: v.quantity as number };
  if (
    v.type === "remove" &&
    typeof v.lineId === "string" &&
    v.lineId.length <= 250
  )
    return { type: "remove", lineId: v.lineId };
  throw new Error("Artículo o cantidad inválidos.");
}
function validQuantity(v: unknown, min: number) {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= 99;
}
