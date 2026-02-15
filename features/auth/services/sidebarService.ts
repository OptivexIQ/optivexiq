import { getServerUser } from "@/lib/auth/getServerUser";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { getUsageSummary } from "@/features/usage/services/usageSummaryService";
import { logger } from "@/lib/logger";

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMidnight(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function formatResetLabel(periodEndIso: string) {
  const periodEnd = new Date(periodEndIso);
  if (Number.isNaN(periodEnd.getTime())) {
    return "Next report quota reset date unavailable.";
  }

  const now = new Date();
  const daysUntil = Math.ceil(
    (toUtcMidnight(periodEnd) - toUtcMidnight(now)) / DAY_MS,
  );

  if (daysUntil <= 0) {
    return "Next report quota resets today.";
  }

  const dayLabel = daysUntil === 1 ? "day" : "days";
  return `Next report quota resets in ${daysUntil} ${dayLabel}.`;
}

export async function getSidebarQuotaResetLabel() {
  try {
    const user = await getServerUser();
    if (!user) {
      return "Sign in to view quota cycle.";
    }

    const subscription = await getSubscription(user.id);
    if (!subscription) {
      return "Subscription required to run reports.";
    }

    const usageSummary = await getUsageSummary(user.id, subscription);
    if (!usageSummary.ok) {
      return "Next report quota reset unavailable.";
    }

    if (!usageSummary.data.lifecycle.is_entitled) {
      return "Subscription required to run reports.";
    }

    if (!usageSummary.data.lifecycle.is_recurring) {
      return "Report quota does not reset (lifetime entitlement).";
    }

    const periodEnd = usageSummary.data.billing_period_end;
    if (!periodEnd) {
      return "Next report quota reset date unavailable.";
    }

    return formatResetLabel(periodEnd);
  } catch (error) {
    logger.error("Failed to build sidebar quota reset label.", error);
    return "Next report quota reset unavailable.";
  }
}
