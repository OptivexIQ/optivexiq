import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import type {
  BillingPlan,
  SubscriptionRecord,
} from "@/features/billing/types/billing.types";

type UpsertResult = {
  ok: boolean;
  error?: string;
};

type SubscriptionIdentityRow = {
  user_id: string;
  plan: BillingPlan;
  lemonsqueezy_customer_id: string | null;
  lemonsqueezy_subscription_id: string | null;
};

type ResolveByLemonIdsResult =
  | { ok: true; row: SubscriptionIdentityRow | null }
  | { ok: false; error: string };

export async function upsertSubscription(
  record: SubscriptionRecord,
): Promise<UpsertResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("subscriptions")
      .upsert(record, { onConflict: "user_id" });

    if (error) {
      logger.error("Failed to upsert subscription.", error, {
        user_id: record.user_id,
      });
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    logger.error("Subscription upsert crashed.", error, {
      user_id: record.user_id,
    });
    return { ok: false, error: "Unexpected error" };
  }
}

export async function resolveSubscriptionByLemonIds(params: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<ResolveByLemonIdsResult> {
  const subscriptionId = params.subscriptionId?.trim() || null;
  const customerId = params.customerId?.trim() || null;

  if (!subscriptionId && !customerId) {
    return { ok: true, row: null };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const filters: string[] = [];
    if (subscriptionId) {
      filters.push(`lemonsqueezy_subscription_id.eq.${subscriptionId}`);
    }
    if (customerId) {
      filters.push(`lemonsqueezy_customer_id.eq.${customerId}`);
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "user_id, plan, lemonsqueezy_customer_id, lemonsqueezy_subscription_id",
      )
      .or(filters.join(","))
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Failed to resolve subscription by Lemon IDs.", error, {
        subscription_id: subscriptionId,
        customer_id: customerId,
      });
      return { ok: false, error: error.message };
    }

    return { ok: true, row: (data as SubscriptionIdentityRow | null) ?? null };
  } catch (error) {
    logger.error("Subscription Lemon ID resolution crashed.", error, {
      subscription_id: subscriptionId,
      customer_id: customerId,
    });
    return { ok: false, error: "Unexpected error" };
  }
}
