import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

const PROVIDER = "lemonsqueezy";
const REPLAY_WINDOW_MINUTES = 10;
const FAILURE_WINDOW_MINUTES = 15;
const FAILURE_ALERT_THRESHOLD = 3;

export type WebhookDeliveryTelemetry = {
  eventName: string;
  subscriptionId: string | null;
  statusCode: number;
  durationMs: number;
  errorMessage: string | null;
};

function sanitizeText(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFingerprint(rawBody: string, signature: string): string {
  const hash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  return `${signature}:${hash}`;
}

export async function detectWebhookReplaySignal(
  rawBody: string,
  signature: string,
): Promise<{ fingerprint: string; replaySignal: boolean }> {
  const fingerprint = toFingerprint(rawBody, signature);
  const admin = createSupabaseAdminClient("webhook");
  const since = new Date(
    Date.now() - REPLAY_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("webhook_delivery_events")
    .select("id")
    .eq("provider", PROVIDER)
    .eq("delivery_fingerprint", fingerprint)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error("Webhook replay detection query failed.", error, {
      provider: PROVIDER,
    });
    return { fingerprint, replaySignal: false };
  }

  return { fingerprint, replaySignal: Boolean(data?.id) };
}

export async function persistWebhookDeliveryTelemetry(
  params: {
    fingerprint: string;
    replaySignal: boolean;
  } & WebhookDeliveryTelemetry,
): Promise<void> {
  const admin = createSupabaseAdminClient("webhook");
  const success = params.statusCode < 400;

  const { error } = await admin.from("webhook_delivery_events").insert({
    provider: PROVIDER,
    delivery_fingerprint: params.fingerprint,
    event_name: sanitizeText(params.eventName),
    subscription_id: sanitizeText(params.subscriptionId),
    status_code: params.statusCode,
    success,
    replay_signal: params.replaySignal,
    duration_ms: Math.max(0, Math.round(params.durationMs)),
    error_message: sanitizeText(params.errorMessage),
  });

  if (error) {
    logger.error("Webhook delivery telemetry insert failed.", error, {
      provider: PROVIDER,
      event_name: params.eventName,
      status_code: params.statusCode,
    });
  }
}

export async function maybeRecordWebhookFailureAlert(params: {
  eventName: string;
  statusCode: number;
}): Promise<{ countWindow: number }> {
  const admin = createSupabaseAdminClient("webhook");
  const since = new Date(
    Date.now() - FAILURE_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const { count, error } = await admin
    .from("webhook_delivery_events")
    .select("id", { count: "exact", head: true })
    .eq("provider", PROVIDER)
    .eq("success", false)
    .eq("event_name", params.eventName)
    .eq("status_code", params.statusCode)
    .gte("created_at", since);

  if (error) {
    logger.error("Webhook failure count query failed.", error, {
      provider: PROVIDER,
      event_name: params.eventName,
      status_code: params.statusCode,
    });
    return { countWindow: 0 };
  }

  const failureCount = count ?? 0;
  if (failureCount !== FAILURE_ALERT_THRESHOLD) {
    return { countWindow: failureCount };
  }

  const { error: alertError } = await admin.from("operational_alerts").insert({
    severity: "high",
    source: "billing.webhook.lemonsqueezy",
    message: "Repeated LemonSqueezy webhook failures detected.",
    context: {
      event_name: params.eventName,
      status_code: params.statusCode,
      failure_count_window: failureCount,
      failure_window_minutes: FAILURE_WINDOW_MINUTES,
      threshold: FAILURE_ALERT_THRESHOLD,
    },
  });

  if (alertError) {
    logger.error("Webhook failure alert insert failed.", alertError, {
      provider: PROVIDER,
      event_name: params.eventName,
      status_code: params.statusCode,
    });
  }

  return { countWindow: failureCount };
}
