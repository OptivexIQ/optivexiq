import { getActiveSubscription } from "@/features/billing/services/planValidationService";
import { getUsage } from "@/features/usage/services/usageTracker";
import { getPlanLimits } from "@/features/billing/services/planLimitsService";
import type { QuotaWindow } from "@/features/billing/services/planLimitsService";
import type { UsageRecord } from "@/features/usage/types/usage.types";

export type QuotaError = {
  code:
    | "NO_ACTIVE_SUBSCRIPTION"
    | "QUOTA_EXCEEDED"
    | "USAGE_MISSING"
    | "LIMITS_MISSING";
  message: string;
  upgrade_required: boolean;
};

function buildQuotaError(
  code: QuotaError["code"],
  message: string,
  upgradeRequired: boolean,
): QuotaError {
  return { code, message, upgrade_required: upgradeRequired };
}

function resolveUsageCount(
  usage: UsageRecord,
  window: QuotaWindow,
  key: "tokens" | "competitor_gaps" | "rewrites",
): number {
  const used = (() => {
    if (key === "tokens") {
      return usage.tokens_used ?? 0;
    }

    if (key === "competitor_gaps") {
      return usage.competitor_gaps_used ?? 0;
    }

    return usage.rewrites_used ?? 0;
  })();

  return window === "lifetime" ? used : used;
}

function isUnlimited(limit: number | null) {
  return limit === null;
}

function assertWithinLimit(
  used: number,
  limit: number | null,
  message: string,
) {
  if (isUnlimited(limit)) {
    return;
  }

  if (used >= limit) {
    throw buildQuotaError("QUOTA_EXCEEDED", message, true);
  }
}

export async function assertCanGenerate(userId: string) {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    throw buildQuotaError(
      "NO_ACTIVE_SUBSCRIPTION",
      "Active subscription required",
      true,
    );
  }

  const usage = await getUsage(userId);
  if (!usage) {
    throw buildQuotaError("USAGE_MISSING", "Usage tracking unavailable", false);
  }

  const limits = await getPlanLimits(subscription.plan);
  if (!limits) {
    throw buildQuotaError("LIMITS_MISSING", "Plan limits unavailable", false);
  }

  const tokensUsed = resolveUsageCount(usage, limits.token_window, "tokens");
  assertWithinLimit(tokensUsed, limits.token_limit, "Token limit reached");

  const rewritesUsed = resolveUsageCount(
    usage,
    limits.rewrite_window,
    "rewrites",
  );
  assertWithinLimit(
    rewritesUsed,
    limits.rewrite_limit,
    "Rewrite limit reached",
  );
}

export async function assertCanCreateGapReport(userId: string) {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    throw buildQuotaError(
      "NO_ACTIVE_SUBSCRIPTION",
      "Active subscription required",
      true,
    );
  }

  const usage = await getUsage(userId);
  if (!usage) {
    throw buildQuotaError("USAGE_MISSING", "Usage tracking unavailable", false);
  }

  const limits = await getPlanLimits(subscription.plan);
  if (!limits) {
    throw buildQuotaError("LIMITS_MISSING", "Plan limits unavailable", false);
  }

  const competitorGapsUsed = resolveUsageCount(
    usage,
    limits.competitor_gap_window,
    "competitor_gaps",
  );

  assertWithinLimit(
    competitorGapsUsed,
    limits.competitor_gap_limit,
    "Competitor gap limit reached",
  );
}
