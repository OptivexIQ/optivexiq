export type BillingTier = {
  planKey: "starter" | "pro" | "growth";
  name: string;
  priceCents: number;
  currency: string;
  period: string;
  highlighted?: boolean;
  description: string;
  cta: string;
  features: string[];
};

export type BillingData = {
  headline: string;
  currentPlan: {
    key: "starter" | "pro" | "growth";
    name: string;
    renewalDate: string;
    renewalLabel: string;
    status: string;
    seats: string;
  };
  usage: {
    reportsUsed: number;
    reportsLimit: number;
    reportsUnlimited: boolean;
    reportsLimitLabel: string;
    reportsPercent: number;
    competitorAnalyses: number;
    competitorLimit: number;
    competitorUnlimited: boolean;
    competitorLimitLabel: string;
    competitorPercent: number;
  };
  tiers: BillingTier[];
  trust: string[];
};

export const billingCatalogData: Omit<
  BillingData,
  "currentPlan" | "usage" | "tiers"
> & {
  tiers: BillingTier[];
} = {
  headline: "Billing & Plan",
  tiers: [
    {
      planKey: "starter",
      name: "Conversion Starter",
      priceCents: 4900,
      currency: "EUR",
      period: "one-time",
      description: "Positioning audit and strategic rewrite for core pages.",
      cta: "Start once",
      features: [
        "Homepage rewrite",
        "Pricing page rewrite",
        "Basic gap analysis",
        "Export as PDF",
      ],
    },
    {
      planKey: "pro",
      name: "SaaS Conversion Pro",
      priceCents: 9900,
      currency: "EUR",
      period: "per month",
      highlighted: true,
      description: "Continuous conversion intelligence for growth teams.",
      cta: "Manage plan",
      features: [
        "Homepage + pricing rewrites",
        "Competitor gap analysis",
        "Objection coverage engine",
        "Differentiation builder",
        "Export integrations",
        "Priority analysis queue",
      ],
    },
    {
      planKey: "growth",
      name: "Growth Intelligence",
      priceCents: 14900,
      currency: "EUR",
      period: "custom",
      description: "Advanced capabilities available through custom engagement.",
      cta: "Contact Sales",
      features: [
        "Everything in Pro",
        "Advanced capabilities for complex use cases",
        "Custom engagement for high-volume teams",
        "Strategic support aligned to operating requirements",
        "Team collaboration (up to 5)",
        "Custom implementation planning",
      ],
    },
  ],
  trust: [
    "Secure cloud hosting",
    "Encrypted connections (HTTPS/TLS)",
    "Access-controlled environments",
    "Continuous infrastructure monitoring",
  ],
};
