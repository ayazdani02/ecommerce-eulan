import { NextResponse } from "next/server";
import { commerce } from "@/commerce/provider";
import { cartId, cartResponse, parseAction, sameOrigin } from "@/commerce/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return cartResponse(await commerce().getCart(await cartId()));
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar el carrito." },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no autorizado." },
      { status: 403 },
    );
  try {
    const body = await request.text();
    if (body.length > 2048)
      return NextResponse.json(
        { error: "Solicitud demasiado grande." },
        { status: 413 },
      );
    const action = parseAction(JSON.parse(body));
    return cartResponse(await commerce().mutateCart(await cartId(), action));
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "No pudimos actualizar el carrito.",
      },
      { status: 400 },
    );
  }
}
