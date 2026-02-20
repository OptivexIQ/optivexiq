import {
  getUsage,
  initializeUsageIfMissing,
} from "@/features/usage/services/usageTracker";
import type { SubscriptionRecord } from "@/features/billing/types/billing.types";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import {
  evaluateSubscriptionLifecycle,
  type LifecycleState,
} from "@/features/billing/services/subscriptionLifecycleService";

const LIFETIME_USAGE_PERIOD_END = "9999-12-31T00:00:00.000Z";

function resolveUsagePeriodEnd(
  subscription: SubscriptionRecord,
  isRecurring: boolean,
): string | null {
  if (isRecurring) {
    return subscription.current_period_end;
  }

  return LIFETIME_USAGE_PERIOD_END;
}

export type UsageSummary = {
  plan: SubscriptionRecord["plan"];
  status: SubscriptionRecord["status"];
  tokens_used: number;
  competitor_gaps_used: number;
  rewrites_used: number;
  ai_cost_cents: number;
  billing_period_end: string | null;
  limits: {
    max_reports: number | null;
    max_rewrites: number | null;
    max_tokens: number | null;
  };
  lifecycle: {
    billing: "one_time" | "monthly";
    state: LifecycleState;
    is_recurring: boolean;
    is_entitled: boolean;
  };
};

export type UsageSummaryResult =
  | { ok: true; data: UsageSummary }
  | { ok: false; status: number; error: string };

export async function getUsageSummary(
  userId: string,
  subscription: SubscriptionRecord,
): Promise<UsageSummaryResult> {
  const limits = await getPlanLimits(subscription.plan);
  if (!limits) {
    return { ok: false, status: 500, error: "Plan limits unavailable" };
  }

  const lifecycle = evaluateSubscriptionLifecycle(subscription, limits.billing);
  let usage = await getUsage(userId);

  if (!usage) {
    const billingPeriodEnd = resolveUsagePeriodEnd(
      subscription,
      lifecycle.isRecurring,
    );
    if (!billingPeriodEnd) {
      return {
        ok: false,
        status: 500,
        error: "Usage tracking unavailable",
      };
    }

    usage = await initializeUsageIfMissing(userId, billingPeriodEnd);
  }

  if (!usage) {
    return { ok: false, status: 500, error: "Usage tracking unavailable" };
  }

  return {
    ok: true,
    data: {
      plan: subscription.plan,
      status: subscription.status,
      tokens_used: usage.tokens_used,
      competitor_gaps_used: usage.competitor_gaps_used,
      rewrites_used: usage.rewrites_used,
      ai_cost_cents: usage.ai_cost_cents,
      billing_period_end: usage.billing_period_end ?? null,
      limits: {
        max_reports: limits.competitor_gap_limit,
        max_rewrites: limits.rewrite_limit,
        max_tokens: limits.token_limit,
      },
      lifecycle: {
        billing: limits.billing,
        state: lifecycle.state,
        is_recurring: lifecycle.isRecurring,
        is_entitled: lifecycle.isEntitled,
      },
    },
  };
}
