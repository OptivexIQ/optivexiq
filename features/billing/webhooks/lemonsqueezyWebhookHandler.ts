import crypto from "crypto";
import { logger } from "@/lib/logger";
import { LEMONSQUEEZY_WEBHOOK_SECRET } from "@/lib/env";
import type {
  BillingPlan,
  SubscriptionRecord,
  SubscriptionStatus,
} from "@/features/billing/types/billing.types";
import {
  resolveSubscriptionByLemonIds,
  upsertSubscription,
} from "@/features/billing/services/subscriptionService";
import {
  resolveCheckoutSessionBySubscriptionId,
  resolveCheckoutSessionForWebhook,
} from "@/features/billing/services/checkoutSessionService";

type WebhookResult = {
  status: number;
  body: { received: boolean; message?: string };
};

type WebhookContext = {
  rawBody: string;
  signature: string;
};

type LemonSqueezyPayload = {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; checkout_ref?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      ends_at?: string | null;
      variant_name?: string;
      customer_id?: string | number;
      custom_data?: { user_id?: string; checkout_ref?: string };
    };
  };
};

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

function verifySignature(rawBody: string, signature: string): boolean {
  if (!LEMONSQUEEZY_WEBHOOK_SECRET) {
    logger.error("Missing LEMONSQUEEZY_WEBHOOK_SECRET.");
    return false;
  }

  if (!signature) {
    return false;
  }

  const hmac = crypto
    .createHmac("sha256", LEMONSQUEEZY_WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

function mapPlan(variantName?: string): BillingPlan | null {
  if (!variantName) {
    return null;
  }

  const normalized = variantName.toLowerCase();

  if (normalized.includes("starter")) {
    return "starter";
  }

  if (normalized.includes("pro")) {
    return "pro";
  }

  if (normalized.includes("growth")) {
    return "growth";
  }

  return null;
}

function mapStatus(status?: string): SubscriptionStatus {
  if (!status) {
    return "inactive";
  }

  const normalized = status.toLowerCase();
  if (["active", "trialing", "on_trial"].includes(normalized)) {
    return "active";
  }
  if (["past_due", "unpaid"].includes(normalized)) {
    return "past_due";
  }
  if (["cancelled", "canceled"].includes(normalized)) {
    return "canceled";
  }
  if (["expired", "ended"].includes(normalized)) {
    return "expired";
  }

  return "inactive";
}

function extractCheckoutReference(payload: LemonSqueezyPayload): string | null {
  return (
    payload.meta?.custom_data?.checkout_ref ??
    payload.data?.attributes?.custom_data?.checkout_ref ??
    null
  );
}

function extractCustomerId(payload: LemonSqueezyPayload): string | null {
  const customerId = payload.data?.attributes?.customer_id;
  if (customerId === undefined || customerId === null) {
    return null;
  }

  return String(customerId);
}

function buildSubscriptionRecord(
  payload: LemonSqueezyPayload,
  params: {
    userId: string;
    requestedPlan?: BillingPlan | null;
    existingPlan?: BillingPlan | null;
    existingCustomerId?: string | null;
  },
): SubscriptionRecord | null {
  const variantName = payload.data?.attributes?.variant_name;
  const mappedPlan = mapPlan(variantName);
  const subscriptionId = payload.data?.id ? String(payload.data.id) : null;
  const customerId = extractCustomerId(payload) ?? params.existingCustomerId ?? null;

  const plan =
    mappedPlan ??
    params.requestedPlan ??
    params.existingPlan ??
    null;

  if (
    !plan ||
    !params.userId ||
    !subscriptionId ||
    !customerId
  ) {
    return null;
  }

  if (params.requestedPlan && mappedPlan && mappedPlan !== params.requestedPlan) {
    return null;
  }

  return {
    user_id: params.userId,
    lemonsqueezy_customer_id: customerId,
    lemonsqueezy_subscription_id: subscriptionId,
    plan,
    status: mapStatus(payload.data?.attributes?.status),
    current_period_end: payload.data?.attributes?.ends_at ?? null,
  };
}

export async function handleLemonSqueezyWebhook({
  rawBody,
  signature,
}: WebhookContext): Promise<WebhookResult> {
  if (!verifySignature(rawBody, signature)) {
    logger.warn("Invalid LemonSqueezy webhook signature.");
    return {
      status: 401,
      body: { received: false, message: "Invalid signature" },
    };
  }

  let payload: LemonSqueezyPayload;
  try {
    payload = JSON.parse(rawBody) as LemonSqueezyPayload;
  } catch (error) {
    logger.warn("Unable to parse LemonSqueezy webhook payload.", { error });
    return {
      status: 400,
      body: { received: false, message: "Invalid payload" },
    };
  }

  const eventName = payload.meta?.event_name;

  if (!eventName || !HANDLED_EVENTS.has(eventName)) {
    logger.info("Ignored LemonSqueezy webhook event.", { eventName });
    return { status: 200, body: { received: true } };
  }

  const subscriptionId = payload.data?.id ? String(payload.data.id) : null;
  const customerId = extractCustomerId(payload);
  const checkoutRef = extractCheckoutReference(payload);
  if (!subscriptionId) {
    logger.warn("Webhook payload missing required checkout mapping fields.", {
      eventName,
    });
    return {
      status: 400,
      body: { received: false, message: "Missing subscription identifier" },
    };
  }

  let resolvedUserId: string | null = null;
  let requestedPlan: BillingPlan | null = null;
  let existingPlan: BillingPlan | null = null;
  let existingCustomerId: string | null = null;
  let idempotent = false;
  let resolvedBy: "checkout_ref" | "subscription_lookup" | null = null;

  if (checkoutRef) {
    const checkoutSession = await resolveCheckoutSessionForWebhook(
      checkoutRef,
      subscriptionId,
    );
    if (checkoutSession.ok) {
      resolvedUserId = checkoutSession.userId;
      requestedPlan = checkoutSession.requestedPlan;
      idempotent = checkoutSession.idempotent;
      resolvedBy = "checkout_ref";
    } else {
      logger.warn("Webhook checkout reference resolution failed.", {
        eventName,
        checkout_ref: checkoutRef,
        reason: checkoutSession.error,
      });
    }
  }

  if (!resolvedUserId) {
    const existing = await resolveSubscriptionByLemonIds({
      subscriptionId,
      customerId,
    });
    if (!existing.ok) {
      return {
        status: 500,
        body: { received: false, message: existing.error },
      };
    }

    if (existing.row) {
      resolvedUserId = existing.row.user_id;
      existingPlan = existing.row.plan;
      existingCustomerId = existing.row.lemonsqueezy_customer_id;
      idempotent = true;
      resolvedBy = "subscription_lookup";
    }
  }

  if (!resolvedUserId && subscriptionId) {
    const checkoutBySubscription =
      await resolveCheckoutSessionBySubscriptionId(subscriptionId);
    if (checkoutBySubscription.ok) {
      resolvedUserId = checkoutBySubscription.userId;
      requestedPlan = checkoutBySubscription.requestedPlan;
      idempotent = true;
      resolvedBy = "subscription_lookup";
    }
  }

  if (!resolvedUserId) {
    logger.error("Webhook could not resolve subscription ownership.", {
      eventName,
      checkout_ref: checkoutRef,
      subscription_id: subscriptionId,
      customer_id: customerId,
      error_type: "ownership_resolution_failed",
    });
    return {
      status: 500,
      body: { received: false, message: "Ownership resolution failed" },
    };
  }

  const record = buildSubscriptionRecord(
    payload,
    {
      userId: resolvedUserId,
      requestedPlan,
      existingPlan,
      existingCustomerId,
    },
  );
  if (!record) {
    logger.warn("Webhook payload plan mismatch or missing subscription fields.", {
      eventName,
      checkout_ref: checkoutRef ?? null,
      resolved_by: resolvedBy,
    });
    return {
      status: 400,
      body: { received: false, message: "Invalid subscription payload" },
    };
  }

  const result = await upsertSubscription(record);

  if (!result.ok) {
    return { status: 500, body: { received: false, message: "Upsert failed" } };
  }

  logger.info("Subscription upserted from LemonSqueezy webhook.", {
    eventName,
    user_id: record.user_id,
    plan: record.plan,
    status: record.status,
    idempotent,
    resolved_by: resolvedBy,
  });

  return { status: 200, body: { received: true } };
}
