import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import type { BillingPlan } from "@/features/billing/types/billing.types";

// Security invariant:
// Checkout session attribution is server-owned and written with service-role to
// prevent client-side spoofing of billing linkage metadata.

type CheckoutSessionRow = {
  checkout_ref: string;
  user_id: string;
  requested_plan: BillingPlan;
  lemonsqueezy_subscription_id: string | null;
  processed_at: string | null;
};

type CreateCheckoutSessionResult =
  | { ok: true; checkoutRef: string }
  | { ok: false; error: string };

type ResolveCheckoutSessionResult =
  | {
      ok: true;
      userId: string;
      requestedPlan: BillingPlan;
      idempotent: boolean;
    }
  | { ok: false; error: string };

type ResolveBySubscriptionIdResult =
  | {
      ok: true;
      userId: string;
      requestedPlan: BillingPlan;
    }
  | { ok: false; error: string };

const MAX_CREATE_ATTEMPTS = 3;

export async function createPendingCheckoutSession(
  userId: string,
  requestedPlan: BillingPlan,
): Promise<CreateCheckoutSessionResult> {
  const supabase = createSupabaseAdminClient("webhook");

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const checkoutRef = randomUUID();
    const { error } = await supabase.from("billing_checkout_sessions").insert({
      checkout_ref: checkoutRef,
      user_id: userId,
      requested_plan: requestedPlan,
    });

    if (!error) {
      return { ok: true, checkoutRef };
    }
  }

  logger.error("Failed to create pending checkout session.", undefined, {
    user_id: userId,
    requested_plan: requestedPlan,
  });
  return { ok: false, error: "Unable to create checkout session." };
}

async function getCheckoutSessionByRef(
  checkoutRef: string,
): Promise<CheckoutSessionRow | null> {
  const supabase = createSupabaseAdminClient("webhook");
  const { data, error } = await supabase
    .from("billing_checkout_sessions")
    .select(
      "checkout_ref, user_id, requested_plan, lemonsqueezy_subscription_id, processed_at",
    )
    .eq("checkout_ref", checkoutRef)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CheckoutSessionRow;
}

export async function resolveCheckoutSessionForWebhook(
  checkoutRef: string,
  subscriptionId: string,
): Promise<ResolveCheckoutSessionResult> {
  const existing = await getCheckoutSessionByRef(checkoutRef);
  if (!existing) {
    return { ok: false, error: "Checkout reference not found." };
  }

  if (existing.processed_at) {
    if (existing.lemonsqueezy_subscription_id === subscriptionId) {
      return {
        ok: true,
        userId: existing.user_id,
        requestedPlan: existing.requested_plan,
        idempotent: true,
      };
    }

    return { ok: false, error: "Checkout reference already consumed." };
  }

  const supabase = createSupabaseAdminClient("webhook");
  const { data, error } = await supabase
    .from("billing_checkout_sessions")
    .update({
      processed_at: new Date().toISOString(),
      lemonsqueezy_subscription_id: subscriptionId,
    })
    .eq("checkout_ref", checkoutRef)
    .is("processed_at", null)
    .select(
      "checkout_ref, user_id, requested_plan, lemonsqueezy_subscription_id, processed_at",
    )
    .maybeSingle();

  if (!error && data) {
    const row = data as CheckoutSessionRow;
    return {
      ok: true,
      userId: row.user_id,
      requestedPlan: row.requested_plan,
      idempotent: false,
    };
  }

  const raced = await getCheckoutSessionByRef(checkoutRef);
  if (
    raced?.processed_at &&
    raced.lemonsqueezy_subscription_id === subscriptionId
  ) {
    return {
      ok: true,
      userId: raced.user_id,
      requestedPlan: raced.requested_plan,
      idempotent: true,
    };
  }

  return { ok: false, error: "Unable to resolve checkout reference." };
}

export async function resolveCheckoutSessionBySubscriptionId(
  subscriptionId: string,
): Promise<ResolveBySubscriptionIdResult> {
  const normalized = subscriptionId.trim();
  if (!normalized) {
    return { ok: false, error: "Subscription identifier missing." };
  }

  const supabase = createSupabaseAdminClient("webhook");
  const { data, error } = await supabase
    .from("billing_checkout_sessions")
    .select("user_id, requested_plan")
    .eq("lemonsqueezy_subscription_id", normalized)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: "Checkout session not found by subscription id.",
    };
  }

  return {
    ok: true,
    userId: String(data.user_id),
    requestedPlan: data.requested_plan as BillingPlan,
  };
}


