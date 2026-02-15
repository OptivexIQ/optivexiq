import { fetchSingleBy } from "@/lib/db/dbHelpers";
import { logger } from "@/lib/logger";
import type { SubscriptionRecord } from "@/features/billing/types/billing.types";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import { evaluateSubscriptionLifecycle } from "@/features/billing/services/subscriptionLifecycleService";

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
  const result = await fetchSingleBy<SubscriptionRecord>(
    "subscriptions",
    "user_id",
    userId,
  );

  if (result.error) {
    logger.error("Failed to fetch subscription.", {
      user_id: userId,
      error: result.error,
    });
  }

  return result.data ?? null;
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
