import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { handleLemonSqueezyWebhook } from "@/features/billing/webhooks/lemonsqueezyWebhookHandler";
import { errorResponse } from "@/lib/api/errorResponse";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  const result = await handleLemonSqueezyWebhook({ rawBody, signature });

  if (result.status >= 400) {
    const message = result.body.message ?? "Webhook failed.";
    const code =
      result.status === 401
        ? "unauthorized"
        : result.status === 400
          ? "invalid_payload"
          : "internal_error";

    return errorResponse(code, message, result.status, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "x-request-id": requestId },
  });
}
