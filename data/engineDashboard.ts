export type EngineStatus = "idle" | "running" | "complete";

export type EngineExplainer = {
  title: string;
  description: string;
};

export type EngineData = {
  headline: string;
  status: EngineStatus;
  latestReport: {
    id: string | null;
    status: "queued" | "running" | "completed" | "failed" | null;
    executionStage: string | null;
    executionProgress: number | null;
  };
  formDefaults: {
    homepageUrl: string;
    pricingUrl: string;
    competitorUrls: string[];
  };
  explainer: EngineExplainer[];
  output: {
    headline: string;
    bullets: string[];
    etaMinutes: number;
  };
};

export const mockEngineData: EngineData = {
  headline: "Conversion Gap Engine",
  status: "idle",
  latestReport: {
    id: null,
    status: null,
    executionStage: null,
    executionProgress: null,
  },
  formDefaults: {
    homepageUrl: "https://acme-saas.com",
    pricingUrl: "https://acme-saas.com/pricing",
    competitorUrls: [
      "https://northwind.ai",
      "https://vectorpay.io",
      "https://signalops.co",
    ],
  },
  explainer: [
    {
      title: "What the engine analyzes",
      description:
        "Homepage positioning, pricing clarity, CTA hierarchy, and competitor overlap across your category.",
    },
    {
      title: "What you get",
      description:
        "A prioritized gap report, rewrite recommendations, and benchmark scores for each page.",
    },
    {
      title: "Estimated time to results",
      description: "6 to 8 minutes for a full multi-page analysis.",
    },
  ],
  output: {
    headline: "Current output preview",
    bullets: [
      "Gap score, pricing overlap, and proof coverage",
      "Homepage rewrite summary with clarity lift",
      "Competitive differentiation statements",
    ],
    etaMinutes: 7,
  },
};

export function getEngineData(): EngineData {
  return mockEngineData;
}
