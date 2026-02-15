import type { SubscriptionRecord, SubscriptionStatus } from "@/features/billing/types/billing.types";
import type { BillingType } from "@/features/billing/services/planLimitsService";

export type LifecycleState = "active" | "past_due" | "canceled" | "expired" | "inactive";

export type SubscriptionLifecycle = {
  billing: BillingType;
  isRecurring: boolean;
  isEntitled: boolean;
  state: LifecycleState;
  periodEnd: number | null;
  hasValidPeriodEnd: boolean;
};

export function hasPaidAccess(
  subscription: Pick<SubscriptionRecord, "status" | "current_period_end">,
  billing: BillingType,
  options?: { allowPastDueGrace?: boolean },
): boolean {
  const normalizedStatus = normalizeStatus(subscription.status);
  const periodEnd = toTimestamp(subscription.current_period_end);
  const hasValidPeriodEnd = periodEnd !== null && periodEnd > Date.now();
  const allowPastDueGrace = options?.allowPastDueGrace === true;

  if (billing === "one_time") {
    return normalizedStatus === "active";
  }

  if (normalizedStatus === "active") {
    return hasValidPeriodEnd;
  }

  if (allowPastDueGrace && normalizedStatus === "past_due") {
    return hasValidPeriodEnd;
  }

  return false;
}

function toTimestamp(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeStatus(status: SubscriptionStatus): LifecycleState {
  if (status === "cancelled") {
    return "canceled";
  }

  if (
    status === "active" ||
    status === "past_due" ||
    status === "canceled" ||
    status === "expired"
  ) {
    return status;
  }

  return "inactive";
}

export function evaluateSubscriptionLifecycle(
  subscription: Pick<SubscriptionRecord, "status" | "current_period_end">,
  billing: BillingType,
): SubscriptionLifecycle {
  const normalizedStatus = normalizeStatus(subscription.status);
  const periodEnd = toTimestamp(subscription.current_period_end);
  const hasValidPeriodEnd = periodEnd !== null && periodEnd > Date.now();
  const isRecurring = billing === "monthly";
  const isEntitled = hasPaidAccess(subscription, billing);

  if (!isRecurring) {
    return {
      billing,
      isRecurring: false,
      isEntitled,
      state: normalizedStatus === "active" ? "active" : "inactive",
      periodEnd,
      hasValidPeriodEnd: periodEnd !== null,
    };
  }

  if (isEntitled) {
    return {
      billing,
      isRecurring: true,
      isEntitled: true,
      state: "active",
      periodEnd,
      hasValidPeriodEnd: true,
    };
  }

  if (normalizedStatus === "active" && !hasValidPeriodEnd) {
    return {
      billing,
      isRecurring: true,
      isEntitled: false,
      state: "expired",
      periodEnd,
      hasValidPeriodEnd: false,
    };
  }

  return {
    billing,
    isRecurring: true,
    isEntitled: false,
    state: normalizedStatus,
    periodEnd,
    hasValidPeriodEnd: hasValidPeriodEnd,
  };
}
