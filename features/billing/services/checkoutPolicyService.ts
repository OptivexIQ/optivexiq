import { getSubscription } from "@/features/billing/services/planValidationService";
import type { BillingPlan } from "@/features/billing/types/billing.types";
import { BILLING_PLANS } from "@/lib/constants/plans";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import { hasPaidAccess } from "@/features/billing/services/subscriptionLifecycleService";

export type CheckoutPlan = BillingPlan;

type CheckoutPolicyDeniedCode =
  | "SUBSCRIPTION_MISSING"
  | "SAME_PLAN_ACTIVE"
  | "DOWNGRADE_OR_LATERAL";

type CheckoutPolicyResult =
  | { ok: true; plan: BillingPlan }
  | { ok: false; code: CheckoutPolicyDeniedCode; message: string };

const PLAN_RANK: Record<BillingPlan, number> = {
  starter: 1,
  pro: 2,
  growth: 3,
};

export function parseCheckoutPlan(value: unknown): BillingPlan | null {
  if (typeof value !== "string") {
    return null;
  }

  return (BILLING_PLANS as readonly string[]).includes(value)
    ? (value as BillingPlan)
    : null;
}

export async function assertCheckoutPolicy(params: {
  userId: string;
  requestedPlan: BillingPlan;
}): Promise<CheckoutPolicyResult> {
  const subscription = await getSubscription(params.userId);
  if (!subscription) {
    return {
      ok: false,
      code: "SUBSCRIPTION_MISSING",
      message: "Subscription missing.",
    };
  }

  const limits = await getPlanLimits(subscription.plan);
  if (!limits) {
    return {
      ok: false,
      code: "SUBSCRIPTION_MISSING",
      message: "Subscription state unavailable.",
    };
  }

  const hasPaidAccessNow = hasPaidAccess(subscription, limits.billing, {
    allowPastDueGrace: true,
  });

  if (
    hasPaidAccessNow &&
    subscription.plan === params.requestedPlan
  ) {
    return {
      ok: false,
      code: "SAME_PLAN_ACTIVE",
      message: "Plan is already active.",
    };
  }

  if (
    hasPaidAccessNow &&
    PLAN_RANK[params.requestedPlan] <= PLAN_RANK[subscription.plan]
  ) {
    return {
      ok: false,
      code: "DOWNGRADE_OR_LATERAL",
      message: "Downgrade or lateral checkout is not allowed.",
    };
  }

  return { ok: true, plan: params.requestedPlan };
}
