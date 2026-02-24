import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { PositioningAnalysisOutput } from "@/features/differentiation-builder/ai/positioningAnalysisModule";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export type CompetitiveMatrixDimension = {
  dimension: string;
  you: string;
  competitors: Array<{
    name: string;
    value: string;
    evidence: string;
  }>;
};

export type CompetitiveMatrixOutput = {
  rows: CompetitiveMatrixDimension[];
};

type CompetitiveMatrixInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  positioning: PositioningAnalysisOutput;
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  const normalized = normalize(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function buildCompetitorText(competitor: CompetitorInsight): string {
  return [
    competitor.summary ?? "",
    ...(competitor.strengths ?? []),
    ...(competitor.weaknesses ?? []),
    ...(competitor.positioning ?? []),
  ].join(" ");
}

function firstEvidence(text: string, keywords: string[], fallback: string): string {
  const raw = text.trim();
  if (!raw) {
    return fallback;
  }

  const normalized = normalize(raw);
  for (const keyword of keywords) {
    const index = normalized.indexOf(keyword);
    if (index === -1) {
      continue;
    }
    const start = Math.max(0, index - 42);
    const end = Math.min(raw.length, index + keyword.length + 72);
    const snippet = raw.slice(start, end).replace(/\s+/g, " ").trim();
    if (snippet.length > 0) {
      return snippet;
    }
  }

  const compact = raw.replace(/\s+/g, " ").trim();
  return compact.length > 0 ? compact.slice(0, 120) : fallback;
}

function dimensionFromSignals(input: {
  dimension: string;
  youKeywords: string[];
  competitorKeywords: string[];
  companyText: string;
  pricingText: string;
  competitor: CompetitorInsight;
}): { you: string; competitorValue: string; evidence: string } {
  const competitorText = buildCompetitorText(input.competitor);
  const youStrong =
    containsAny(input.companyText, input.youKeywords) ||
    containsAny(input.pricingText, input.youKeywords);
  const competitorStrong = containsAny(competitorText, input.competitorKeywords);

  const you = youStrong ? "High" : "Medium";
  const competitorValue = competitorStrong ? "High" : "Medium";

  const evidence = firstEvidence(
    competitorText,
    input.competitorKeywords,
    `No explicit ${input.dimension.toLowerCase()} evidence surfaced from competitor text.`,
  );

  return { you, competitorValue, evidence };
}

export function buildCompetitiveMatrixFromPositioning(
  input: CompetitiveMatrixInput,
): CompetitiveMatrixOutput {
  const companyText = input.companyContent.rawText;
  const pricingText = input.pricingContent?.rawText ?? "";
  const paritySignals = input.positioning.highRiskParityZones.map((item) => normalize(item));

  const dimensions = [
    {
      name: "Complexity",
      youKeywords: ["implementation", "onboarding", "time to value", "simple"],
      competitorKeywords: ["enterprise", "platform", "workflow", "implementation"],
    },
    {
      name: "Price positioning",
      youKeywords: ["pricing", "transparent", "roi", "payback", "value metric"],
      competitorKeywords: ["pricing", "enterprise pricing", "contact sales", "plans"],
    },
    {
      name: "Time-to-value",
      youKeywords: ["fast", "quick", "days", "weeks", "launch"],
      competitorKeywords: ["migration", "setup", "deployment", "rollout"],
    },
    {
      name: "Target segment",
      youKeywords: [normalize(input.profile.icpRole), normalize(input.profile.salesMotion)],
      competitorKeywords: ["enterprise", "mid-market", "startup", "plg", "sales-led"],
    },
    {
      name: "Deployment model",
      youKeywords: ["self-serve", "sales-led", "guided onboarding", "api"],
      competitorKeywords: ["self-serve", "managed", "implementation", "consulting"],
    },
    {
      name: "Differentiation narrative",
      youKeywords: ["differentiation", "decision", "intelligence", "positioning"],
      competitorKeywords: ["ai rewrite", "optimization", "conversion", "copy"],
    },
    {
      name: "Proof signals",
      youKeywords: ["case study", "proof", "metrics", "results", "testimonials"],
      competitorKeywords: ["case study", "testimonial", "proof", "customer stories"],
    },
  ];

  const rows = dimensions.map((dimension) => {
    const normalizedName = normalize(dimension.name);
    const parityHit = paritySignals.some((signal) => signal.includes(normalizedName));

    const competitors = input.competitors.map((competitor) => {
      const derived = dimensionFromSignals({
        dimension: dimension.name,
        youKeywords: dimension.youKeywords.filter((value) => value.length > 0),
        competitorKeywords: dimension.competitorKeywords,
        companyText,
        pricingText,
        competitor,
      });

      return {
        name: competitor.name,
        value: parityHit ? "High" : derived.competitorValue,
        evidence: derived.evidence,
      };
    });

    const youHighBecauseStrength =
      input.positioning.uniqueStrengthSignals.some((signal) =>
        containsAny(signal, [normalizedName]),
      ) ||
      input.positioning.enterpriseDifferentiators.some((signal) =>
        containsAny(signal, [normalizedName]),
      );

    return {
      dimension: dimension.name,
      you: youHighBecauseStrength ? "High" : competitors.length > 0 ? "Medium" : "Low",
      competitors,
    };
  });

  return { rows };
}