import { getSubscription } from "@/features/billing/services/planValidationService";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import { hasPaidAccess } from "@/features/billing/services/subscriptionLifecycleService";
import type { BillingPlan } from "@/features/billing/types/billing.types";

export type BillingEntitlementState = {
  isEntitled: boolean;
  plan: BillingPlan | null;
  status: string;
  currentPeriodEnd: string | null;
};

export async function getBillingEntitlementState(
  userId: string,
): Promise<BillingEntitlementState> {
  const subscription = await getSubscription(userId);
  if (!subscription) {
    return {
      isEntitled: false,
      plan: null,
      status: "inactive",
      currentPeriodEnd: null,
    };
  }

  const limits = await getPlanLimits(subscription.plan);
  if (!limits) {
    return {
      isEntitled: false,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
    };
  }

  return {
    isEntitled: hasPaidAccess(subscription, limits.billing, {
      allowPastDueGrace: true,
    }),
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
  };
}

