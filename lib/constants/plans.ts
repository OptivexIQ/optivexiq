export const BILLING_PLANS = ["starter", "pro", "growth"] as const;

export const PLAN_LABELS: Record<(typeof BILLING_PLANS)[number], string> = {
  starter: "Starter",
  pro: "Pro",
  growth: "Growth",
};
