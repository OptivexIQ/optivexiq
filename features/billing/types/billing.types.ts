export type BillingPlan = "starter" | "pro" | "growth";
export type BillingCurrency = "USD" | "EUR" | "GBP";
export const BILLING_CURRENCIES = ["USD", "EUR", "GBP"] as const;

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "cancelled"
  | "expired"
  | "inactive";

export type SubscriptionRecord = {
  user_id: string;
  lemonsqueezy_customer_id: string;
  lemonsqueezy_subscription_id: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  current_period_end: string | null;
};
