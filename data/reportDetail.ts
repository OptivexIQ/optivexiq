import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";

export type ReportWeakness = {
  title: string;
  description: string;
};

export type ReportSection = {
  title: string;
  value: string;
  detail: string;
};

export type ReportDetailData = {
  reportId: string;
  site: string;
  generatedAt: string;
  score: number;
  status: "Complete" | "Running";
  categoryScores: {
    positioningClarity: {
      score: number;
      label: string;
    };
    pricingEffectiveness: {
      score: number;
      label: string;
    };
    differentiation: {
      score: number;
      label: string;
    };
  };
  messagingOverlap: {
    data: Array<{ competitor: string; you: number; competitors: number }>;
    insight: string;
  };
  weaknesses: ReportWeakness[];
  overlap: {
    category: string;
    percent: number;
  }[];
  homepageRewrite: {
    before: string;
    after: string;
    lift: string;
    highlights: string[];
  };
  pricingInsights: {
    clarityScore: number;
    objectionCoverage: number;
    suggestedStructure: string[];
  };
  objectionCoverage: {
    items: Array<{
      label: string;
      value: number;
      variant:
        | "critical-solid"
        | "warning-solid"
        | "info-solid"
        | "performance-solid"
        | "default";
    }>;
  };
  competitivePositioning: {
    differentiation: {
      label: string;
      summary: string;
    }[];
    counterPositioning: string[];
  };
};

export const mockReportDetail: ReportDetailData = {
  reportId: "rep_112",
  site: "acme-saas.com",
  generatedAt: "Feb 08, 2026",
  score: 34,
  status: "Complete",
  categoryScores: {
    positioningClarity: {
      score: 2.1,
      label: "Low",
    },
    pricingEffectiveness: {
      score: 4.8,
      label: "Medium",
    },
    differentiation: {
      score: 1.4,
      label: "Critical",
    },
  },
  messagingOverlap: {
    data: [
      { competitor: "CompA", you: 78, competitors: 62 },
      { competitor: "CompB", you: 54, competitors: 68 },
      { competitor: "CompC", you: 92, competitors: 75 },
      { competitor: "CompD", you: 38, competitors: 58 },
      { competitor: "CompE", you: 71, competitors: 61 },
    ],
    insight: "3 of 5 competitors share 70%+ of your messaging territory",
  },
  weaknesses: [
    {
      title: "Pricing clarity",
      description:
        "Tier value is unclear for enterprise buyers comparing premium tools.",
    },
    {
      title: "Differentiation",
      description:
        "Hero messaging overlaps with two direct competitors by 68 percent.",
    },
    {
      title: "Proof density",
      description:
        "Key proof points show late in the scroll, reducing early confidence.",
    },
  ],
  overlap: [
    { category: "Positioning", percent: 68 },
    { category: "Pricing language", percent: 54 },
    { category: "Use cases", percent: 41 },
  ],
  homepageRewrite: {
    before:
      "The all-in-one platform for modern teams to manage, collaborate, and grow.",
    after:
      "Win more enterprise trials with a conversion intelligence layer built for SaaS founders and growth leads.",
    lift: "+47% clarity lift",
    highlights: [
      "Lead with revenue outcomes instead of feature breadth",
      "Clarify buyer role and decision context",
      "Move trust signals above the fold",
    ],
  },
  pricingInsights: {
    clarityScore: 42,
    objectionCoverage: 38,
    suggestedStructure: [
      "Anchor with enterprise plan outcomes",
      "Expose proof of ROI directly in tier comparison",
      "Add security review and procurement callouts",
    ],
  },
  objectionCoverage: {
    items: [
      { label: "Price justification", value: 15, variant: "critical-solid" },
      { label: "ROI clarity", value: 22, variant: "warning-solid" },
      { label: "Trust signals", value: 38, variant: "performance-solid" },
      { label: "Risk reduction", value: 10, variant: "critical-solid" },
      { label: "Social proof", value: 45, variant: "info-solid" },
    ],
  },
  competitivePositioning: {
    differentiation: [
      {
        label: "Value narrative",
        summary:
          "Shift from tooling language to revenue protection and risk reduction.",
      },
      {
        label: "Primary wedge",
        summary: "Position as revenue intelligence, not AI copywriting.",
      },
      {
        label: "Proof strategy",
        summary:
          "Elevate pricing proof and security wins to match enterprise expectations.",
      },
    ],
    counterPositioning: [
      "Competitors optimize for copy output. OptivexIQ optimizes for revenue outcomes.",
      "Most tools audit pages in isolation. OptivexIQ benchmarks across your category.",
      "Generic audits focus on wording. OptivexIQ prioritizes conversion risk and ROI.",
    ],
  },
};

function formatReportDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function deriveSite(url: string | null) {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function mapStatus(status: string | null): ReportDetailData["status"] {
  switch (status) {
    case "completed":
      return "Complete";
    case "running":
      return "Running";
    case "queued":
      return "Running";
    case "failed":
      return "Running";
    default:
      return "Running";
  }
}

function mapWeaknesses(gaps: unknown): ReportWeakness[] {
  if (!Array.isArray(gaps)) {
    return [];
  }

  return gaps
    .map((item) => String(item))
    .filter((item) => item.length > 0)
    .slice(0, 4)
    .map((item) => ({ title: "Gap", description: item }));
}

export async function getReportDetailData(
  reportId: string,
): Promise<ReportDetailData | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select("id, homepage_url, created_at, status, gap_analysis, rewrites")
      .eq("id", reportId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const gapAnalysis = (data.gap_analysis as Record<string, unknown>) ?? {};
    const rewrites = (data.rewrites as Record<string, unknown>) ?? {};
    const heroRewrite = (rewrites.hero as Record<string, unknown>) ?? {};

    return {
      reportId: data.id,
      site: deriveSite(data.homepage_url ?? null),
      generatedAt: formatReportDate(data.created_at ?? null),
      score: Number(gapAnalysis.score ?? 0),
      status: mapStatus(data.status ?? null),
      categoryScores: {
        positioningClarity: {
          score: 0,
          label: "",
        },
        pricingEffectiveness: {
          score: 0,
          label: "",
        },
        differentiation: {
          score: 0,
          label: "",
        },
      },
      messagingOverlap: {
        data: [],
        insight: "",
      },
      weaknesses: mapWeaknesses(gapAnalysis.gaps),
      overlap: [],
      homepageRewrite: {
        before: "",
        after: String(heroRewrite.headline ?? ""),
        lift: "",
        highlights: [],
      },
      pricingInsights: {
        clarityScore: 0,
        objectionCoverage: 0,
        suggestedStructure: [],
      },
      objectionCoverage: {
        items: [],
      },
      competitivePositioning: {
        differentiation: [],
        counterPositioning: [],
      },
    };
  } catch (error) {
    logger.error("Failed to load report detail data.", error);
    return null;
  }
}
