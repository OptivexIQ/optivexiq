import { logger } from "@/lib/logger";
import type { SubscriptionRecord } from "@/features/billing/types/billing.types";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import { evaluateSubscriptionLifecycle } from "@/features/billing/services/subscriptionLifecycleService";
import { createSupabaseServerClient } from "@/services/supabase/server";

async function isSubscriptionActive(record: SubscriptionRecord | null) {
  if (!record) {
    return false;
  }

  const limits = await getPlanLimits(record.plan);
  if (!limits) {
    return false;
  }

  const lifecycle = evaluateSubscriptionLifecycle(record, limits.billing);
  return lifecycle.isEntitled;
}

export async function getSubscription(
  userId: string,
): Promise<SubscriptionRecord | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== userId) {
      logger.error("Subscription scope validation failed.", authError, {
        user_id: userId,
        session_user_id: authData.user?.id ?? null,
      });
      return null;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "user_id, lemonsqueezy_customer_id, lemonsqueezy_subscription_id, plan, status, current_period_end",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch subscription.", error, {
        user_id: userId,
      });
      return null;
    }

    return (data as SubscriptionRecord | null) ?? null;
  } catch (error) {
    logger.error("Subscription fetch crashed.", error, {
      user_id: userId,
    });
    return null;
  }
}

export async function getActiveSubscription(
  userId: string,
): Promise<SubscriptionRecord | null> {
  const record = await getSubscription(userId);
  return (await isSubscriptionActive(record)) ? record : null;
}

export async function hasActiveSubscription(userId: string) {
  const record = await getActiveSubscription(userId);
  return Boolean(record);
}
