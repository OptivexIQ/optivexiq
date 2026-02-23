import { billingCatalogData } from "@/data/billingPlan";
import type { BillingData } from "@/data/billingPlan";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { BILLING_PLANS } from "@/lib/constants/plans";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import { initializeUsageIfMissing } from "@/features/usage/services/usageTracker";
import type { BillingPlan } from "@/features/billing/types/billing.types";
import type { UsageRecord } from "@/features/usage/types/usage.types";
import type {
  PlanLimitsRecord,
  QuotaWindow,
} from "@/features/billing/services/planLimitsService";
import { evaluateSubscriptionLifecycle } from "@/features/billing/services/subscriptionLifecycleService";

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
};

function formatRenewalDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function buildRenewalLabel(
  billing: "one_time" | "monthly",
  renewalDate: string,
) {
  if (billing === "one_time") {
    return "One-time purchase";
  }

  return `Renews ${renewalDate}`;
}

function normalizeLimit(limit: number | null, fallback: number, used: number) {
  if (limit === null || !Number.isFinite(limit)) {
    return Math.max(used, fallback, 1);
  }

  return Math.max(1, Math.round(limit));
}

function highlightTiers(
  tiers: BillingData["tiers"],
  currentPlanKey: BillingPlan,
) {
  return tiers.map((tier) => ({
    ...tier,
    highlighted: tier.planKey === currentPlanKey,
  }));
}

function resolvePlanDisplayName(planKey: BillingPlan) {
  const tier = billingCatalogData.tiers.find((item) => item.planKey === planKey);
  return tier?.name ?? planKey;
}

function formatQuotaWindowLabel(window: QuotaWindow) {
  return window === "billing_period" ? "billing period" : "lifetime";
}

function buildRewriteFeature(limits: PlanLimitsRecord | null) {
  if (!limits) {
    return "Homepage + pricing rewrites";
  }

  if (limits.rewrite_limit === null) {
    return "No hard cap on homepage + pricing rewrites";
  }

  return `${limits.rewrite_limit} homepage + pricing rewrites per ${formatQuotaWindowLabel(limits.rewrite_window)}`;
}

function buildCompetitorFeature(limits: PlanLimitsRecord | null) {
  if (!limits) {
    return "Competitor gap analysis";
  }

  if (limits.competitor_gap_limit === null) {
    return "Competitor gap analysis (unlimited)";
  }

  return `Competitor gap analysis (${limits.competitor_gap_limit} per ${formatQuotaWindowLabel(limits.competitor_gap_window)})`;
}

function buildTeamFeature(limits: PlanLimitsRecord | null) {
  if (!limits || limits.team_member_limit <= 0) {
    return "Team collaboration";
  }

  return `Team collaboration (up to ${limits.team_member_limit})`;
}

function withRuntimeTierFeatures(
  tiers: BillingData["tiers"],
  limitsByPlan: Partial<Record<BillingPlan, PlanLimitsRecord | null>>,
) {
  return tiers.map((tier) => {
    const limits = limitsByPlan[tier.planKey] ?? null;

    if (tier.planKey === "pro") {
      return {
        ...tier,
        features: [
          buildRewriteFeature(limits),
          buildCompetitorFeature(limits),
          "Objection coverage engine",
          "Differentiation builder",
          "Export integrations",
          "Priority analysis queue",
        ],
      };
    }

    if (tier.planKey === "growth") {
      return {
        ...tier,
        features: [
          "Everything in Pro",
          "Advanced capabilities for complex use cases",
          "Custom engagement for high-volume teams",
          "Strategic support aligned to operating requirements",
          buildTeamFeature(limits),
          "Custom implementation planning",
        ],
      };
    }

    return tier;
  });
}

function formatSeats(count: number | null) {
  if (!count || count <= 0) {
    return "1 seat";
  }

  return count === 1 ? "1 seat" : `${count} seats`;
}

function resolvePlanStatus(
  subscription: SubscriptionRow | null,
  limits: PlanLimitsRecord | null,
) {
  if (!subscription) {
    return "Inactive";
  }

  if (!limits) {
    return "Inactive";
  }

  const lifecycle = evaluateSubscriptionLifecycle(
    {
      status: (subscription.status ?? "inactive") as
        | "active"
        | "past_due"
        | "canceled"
        | "cancelled"
        | "expired"
        | "inactive",
      current_period_end: subscription.current_period_end ?? null,
    },
    limits.billing,
  );

  if (lifecycle.state === "active") {
    return "Active";
  }
  if (lifecycle.state === "past_due") {
    return "Past due";
  }
  if (lifecycle.state === "canceled") {
    return "Canceled";
  }
  if (lifecycle.state === "expired") {
    return "Expired";
  }
  return "Inactive";
}

function resolveLimitLabel(limit: number | null) {
  return limit === null ? "Unlimited" : limit.toString();
}

function resolvePercent(used: number, limit: number | null) {
  if (!limit || limit <= 0 || !Number.isFinite(limit)) {
    return 0;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

export type BillingDataResult =
  | { ok: true; data: BillingData }
  | { ok: false; error: string };

async function fetchBillingData(): Promise<BillingDataResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { ok: false, error: "Unauthorized" };
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    const { data: usage } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    const subscriptionRow = subscription as SubscriptionRow | null;
    if (!subscriptionRow || !subscriptionRow.plan) {
      return { ok: false, error: "Subscription unavailable" };
    }

    if (!BILLING_PLANS.includes(subscriptionRow.plan as BillingPlan)) {
      return { ok: false, error: "Unsupported subscription plan." };
    }
    const planKey = subscriptionRow.plan as BillingPlan;
    const planName = resolvePlanDisplayName(planKey);
    const limits = await getPlanLimits(planKey);
    if (!limits) {
      return { ok: false, error: "Plan limits unavailable" };
    }

    let usageRecord = usage as UsageRecord | null;
    if (!usageRecord) {
      const billingPeriodEnd =
        limits.billing === "one_time"
          ? "9999-12-31T00:00:00.000Z"
          : subscriptionRow.current_period_end;
      if (billingPeriodEnd) {
        usageRecord = await initializeUsageIfMissing(
          authData.user.id,
          billingPeriodEnd,
        );
      }
    }

    if (!usageRecord) {
      return { ok: false, error: "Usage tracking unavailable" };
    }

    const tierLimitEntries = await Promise.all(
      BILLING_PLANS.map(
        async (plan) => [plan, await getPlanLimits(plan)] as const,
      ),
    );
    const limitsByPlan = Object.fromEntries(tierLimitEntries) as Partial<
      Record<BillingPlan, PlanLimitsRecord | null>
    >;

    const reportsUsed = Math.max(0, usageRecord.competitor_gaps_used ?? 0);
    const reportsUnlimited = limits.competitor_gap_limit === null;
    const reportsLimit = reportsUnlimited
      ? Math.max(reportsUsed, 1)
      : normalizeLimit(limits.competitor_gap_limit, 1, reportsUsed);
    const reportsLimitLabel = resolveLimitLabel(limits.competitor_gap_limit);
    const reportsPercent = resolvePercent(
      reportsUsed,
      limits.competitor_gap_limit,
    );

    const competitorAnalyses = reportsUsed;
    const competitorLimit = reportsLimit;
    const competitorUnlimited = reportsUnlimited;
    const competitorLimitLabel = resolveLimitLabel(limits.competitor_gap_limit);
    const competitorPercent = resolvePercent(
      competitorAnalyses,
      limits.competitor_gap_limit,
    );

    const currentPlan = {
      key: planKey,
      name: planName,
      renewalDate: formatRenewalDate(
        subscriptionRow.current_period_end ?? null,
      ),
      renewalLabel: buildRenewalLabel(
        limits.billing,
        formatRenewalDate(subscriptionRow.current_period_end ?? null),
      ),
      status: resolvePlanStatus(subscriptionRow, limits),
      seats: formatSeats(limits.team_member_limit),
    };

    return {
      ok: true,
      data: {
        headline: billingCatalogData.headline,
        currentPlan,
        usage: {
          reportsUsed,
          reportsLimit,
          reportsUnlimited,
          reportsLimitLabel,
          reportsPercent,
          competitorAnalyses,
          competitorLimit,
          competitorUnlimited,
          competitorLimitLabel,
          competitorPercent,
        },
        tiers: highlightTiers(
          withRuntimeTierFeatures(billingCatalogData.tiers, limitsByPlan),
          planKey,
        ),
        trust: billingCatalogData.trust,
      },
    };
  } catch (error) {
    logger.error("Failed to build billing data.", error);
    return { ok: false, error: "Billing data unavailable" };
  }
}

export async function getBillingData(): Promise<BillingDataResult> {
  return fetchBillingData();
}
