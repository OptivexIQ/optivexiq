import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { handleLemonSqueezyWebhook } from "@/features/billing/webhooks/lemonsqueezyWebhookHandler";
import { errorResponse } from "@/lib/api/errorResponse";
import { logger } from "@/lib/logger";
import {
  detectWebhookReplaySignal,
  maybeRecordWebhookFailureAlert,
  persistWebhookDeliveryTelemetry,
} from "@/features/billing/services/webhookObservabilityService";

type MinimalWebhookPayload = {
  meta?: { event_name?: string };
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  let parsedPayload: MinimalWebhookPayload | null = null;
  try {
    parsedPayload = JSON.parse(rawBody) as MinimalWebhookPayload;
  } catch {
    parsedPayload = null;
  }

  const eventName = parsedPayload?.meta?.event_name ?? "unknown";
  const subscriptionId = parsedPayload?.data?.id
    ? String(parsedPayload.data.id)
    : null;
  const replayInfo = await detectWebhookReplaySignal(rawBody, signature);
  const fingerprint = replayInfo.fingerprint;
  const replaySignal = replayInfo.replaySignal;

  if (replaySignal) {
    logger.warn("LemonSqueezy webhook replay signal detected.", {
      request_id: requestId,
      event_name: eventName,
      subscription_id: subscriptionId,
    });
  }

  const result = await handleLemonSqueezyWebhook({ rawBody, signature });
  const durationMs = Date.now() - startedAt;

  await persistWebhookDeliveryTelemetry({
    fingerprint,
    replaySignal,
    eventName,
    subscriptionId,
    statusCode: result.status,
    durationMs,
    errorMessage: result.status >= 400 ? result.body.message ?? null : null,
  });

  logger.info("LemonSqueezy webhook processed.", {
    request_id: requestId,
    event_name: eventName,
    subscription_id: subscriptionId,
    status: result.status,
    duration_ms: durationMs,
    replay_signal: replaySignal,
  });

  if (result.status >= 400) {
    const message = result.body.message ?? "Webhook failed.";
    const code =
      result.status === 401
        ? "unauthorized"
        : result.status === 400
          ? "invalid_payload"
          : "internal_error";
    const failureState = await maybeRecordWebhookFailureAlert({
      eventName,
      statusCode: result.status,
    });
    logger.error("LemonSqueezy webhook failed.", undefined, {
      request_id: requestId,
      event_name: eventName,
      subscription_id: subscriptionId,
      status: result.status,
      duration_ms: durationMs,
      replay_signal: replaySignal,
      failure_count_window: failureState.countWindow,
      failure_window_ms: 15 * 60 * 1000,
    });

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
