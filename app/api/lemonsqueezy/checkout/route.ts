import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { planSchema } from "@/features/billing/validators/planSchema";
import { errorResponse } from "@/lib/api/errorResponse";
import { startCheckoutForUser } from "@/features/billing/services/checkoutStartService";
import { parseCheckoutCurrency } from "@/features/billing/services/checkoutPolicyService";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const user = await requireUser();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    logger.warn("Checkout payload parsing failed.", { error });
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const parsed = planSchema.safeParse(
    typeof payload === "object" && payload !== null
      ? (payload as { plan?: unknown }).plan
      : undefined,
  );

  if (!parsed.success) {
    return errorResponse("invalid_payload", "Invalid plan.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const currency =
    parseCheckoutCurrency(
      typeof payload === "object" && payload !== null
        ? (payload as { currency?: unknown }).currency
        : undefined,
    ) ?? "USD";

  const checkout = await startCheckoutForUser(user.id, parsed.data, currency);
  if (!checkout.ok) {
    logger.warn("Blocked checkout API by policy.", {
      user_id: user.id,
      requested_plan: parsed.data,
      requested_currency: currency,
      reason: checkout.code,
    });
    return errorResponse("forbidden", checkout.message, 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const response = NextResponse.redirect(checkout.url, 302);
  response.headers.set("x-request-id", requestId);
  return response;
}
