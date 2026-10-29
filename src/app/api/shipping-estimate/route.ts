import { NextResponse } from "next/server";
import { sameOrigin } from "@/commerce/http";
import { isChileCommuneId } from "@/integrations/envia/delivery-estimate";
import { getDeliveryEstimate, getDeliveryOptions } from "@/integrations/envia/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { estimate: null, reason: "request_origin" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const body = await request.text();
    if (body.length > 1024) {
      return NextResponse.json(
        { estimate: null, reason: "invalid_request" },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    const input: unknown = JSON.parse(body);
    const communeId =
      input && typeof input === "object" && "communeId" in input
        ? (input as { communeId?: unknown }).communeId
        : null;
    if (!isChileCommuneId(communeId)) {
      return NextResponse.json(
        { estimate: null, reason: "invalid_commune" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const includeAll =
      process.env.NODE_ENV !== "production" &&
      input !== null &&
      typeof input === "object" &&
      "includeAllOptions" in input &&
      (input as { includeAllOptions?: unknown }).includeAllOptions === true;
    const options = includeAll
      ? await getDeliveryOptions(communeId)
      : null;
    const estimate = includeAll
      ? options?.[0] ?? null
      : await getDeliveryEstimate(communeId);
    return NextResponse.json(
      {
        estimate,
        reason: estimate ? null : "no_service",
        ...(includeAll ? { options } : {}),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (process.env.NODE_ENV !== "production") {
      console.warn("[envia-estimate] Configuration or provider error", {
        code: /^(missing_envia_|invalid_envia_)[a-z0-9_]+$/.test(code) ? code : "provider_error",
      });
    }
    const reason = code === "envia_city_not_found"
      ? "invalid_commune"
      : /^(missing_envia_|invalid_envia_)/.test(code)
      ? "configuration"
      : "provider";
    return NextResponse.json(
      { estimate: null, reason },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
