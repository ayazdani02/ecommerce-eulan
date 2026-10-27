import { NextResponse } from "next/server";
import { commerce } from "@/commerce/provider";
import { cartId, sameOrigin } from "@/commerce/http";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no autorizado." },
      { status: 403 },
    );
  try {
    const provider = commerce();
    const id = await cartId();
    const cart = await provider.getCart(id);
    if (!cart.lines.length)
      return NextResponse.json(
        { error: "Agrega una pieza a tu carrito antes de continuar." },
        { status: 400 },
      );
    return NextResponse.json(await provider.checkout(cart.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "No pudimos iniciar el pago seguro. Inténtalo nuevamente." },
      { status: 503 },
    );
  }
}
