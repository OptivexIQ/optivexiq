import { logger } from "@/lib/logger";
import { getActiveSubscription } from "@/features/billing/services/planValidationService";
import {
  getUsage,
  initializeUsageIfMissing,
  resetUsage,
} from "@/features/usage/services/usageTracker";
import type { UsageRecord } from "@/features/usage/types/usage.types";

function toTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function nowIso() {
  return new Date().toISOString();
}

function getResetStart(usage: UsageRecord) {
  return toTimestamp(usage.billing_period_end)
    ? usage.billing_period_end
    : nowIso();
}

export async function ensureBillingPeriodValid(
  userId: string,
): Promise<UsageRecord | null> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription?.current_period_end) {
    return null;
  }

  const currentPeriodEnd = toTimestamp(subscription.current_period_end);
  if (!currentPeriodEnd) {
    logger.warn("Invalid subscription period end.", {
      user_id: userId,
      current_period_end: subscription.current_period_end,
    });
    return null;
  }

  const usage = await getUsage(userId);
  if (!usage) {
    return initializeUsageIfMissing(userId, subscription.current_period_end);
  }

  const usagePeriodEnd = toTimestamp(usage.billing_period_end);
  if (!usagePeriodEnd) {
    logger.warn("Invalid usage period end.", {
      user_id: userId,
      billing_period_end: usage.billing_period_end,
    });
    return usage;
  }

  if (currentPeriodEnd <= usagePeriodEnd) {
    return usage;
  }

  const resetResult = await resetUsage(
    userId,
    getResetStart(usage),
    subscription.current_period_end,
  );

  if (!resetResult.ok) {
    logger.error("Failed to reset usage period.", {
      user_id: userId,
      error: resetResult.error,
    });
    return usage;
  }

  return resetResult.record ?? usage;
}
