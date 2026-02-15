export type BillingPlan = "starter" | "pro" | "growth";

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
