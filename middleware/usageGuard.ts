import { errorResponse } from "@/lib/api/errorResponse";
import {
  hasActiveSubscription,
  getActiveSubscription,
} from "@/features/billing/services/planValidationService";
import { ensureBillingPeriodValid } from "@/features/usage/services/billingPeriodReset";
import type { SubscriptionRecord } from "@/features/billing/types/billing.types";
import { logger } from "@/lib/logger";

export type UsageGuardResult =
  | { subscription: SubscriptionRecord }
  | { response: Response };

export async function usageGuard(
  userId: string,
  requestId: string,
  pathname: string,
): Promise<UsageGuardResult> {
  const timestamp = new Date().toISOString();
  const hasSubscription = await hasActiveSubscription(userId);
  if (!hasSubscription) {
    logger.warn("usage_guard_denied", {
      user_id: userId,
      route: pathname,
      quota_state: "no_active_subscription",
      denial_reason: "NO_ACTIVE_SUBSCRIPTION",
      timestamp,
      request_id: requestId,
    });
    return {
      response: errorResponse(
        "forbidden",
        "Active subscription required.",
        403,
        {
          requestId,
          headers: { "x-request-id": requestId },
        },
      ),
    };
  }

  await ensureBillingPeriodValid(userId);
  const subscription = await getActiveSubscription(userId);

  if (!subscription) {
    logger.warn("usage_guard_denied", {
      user_id: userId,
      route: pathname,
      quota_state: "inactive_subscription",
      denial_reason: "ACTIVE_SUBSCRIPTION_RESOLUTION_FAILED",
      timestamp,
      request_id: requestId,
    });
    return {
      response: errorResponse(
        "forbidden",
        "Active subscription required.",
        403,
        {
          requestId,
          headers: { "x-request-id": requestId },
        },
      ),
    };
  }

  return { subscription };
}
