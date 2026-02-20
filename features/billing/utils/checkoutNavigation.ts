import type {
  BillingCurrency,
  BillingPlan,
} from "@/features/billing/types/billing.types";

export function getCheckoutIntentUrl(
  plan: BillingPlan,
  returnTo?: string,
  currency?: BillingCurrency,
): string {
  const base = `/checkout?plan=${encodeURIComponent(plan)}${
    currency ? `&currency=${encodeURIComponent(currency)}` : ""
  }`;
  if (!returnTo) {
    return base;
  }
  return `${base}&returnTo=${encodeURIComponent(returnTo)}`;
}

export function getLoginRedirectUrl(intentUrl: string): string {
  return `/login?redirect=${encodeURIComponent(intentUrl)}`;
}
