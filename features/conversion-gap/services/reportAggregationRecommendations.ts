import type {
  ConversionGapReport,
  RewriteRecommendation,
} from "@/features/conversion-gap/types/conversionGapReport.types";
import type { GapAnalysisOutput } from "@/features/conversion-gap/types/gap.types";
import type { GapRewrites } from "@/features/conversion-gap/services/reportAggregation.types";
import type { PriorityInput } from "@/features/conversion-gap/types/priority.types";
import { extractObjectionCoverageScore } from "@/features/conversion-gap/services/objectionCoverageService";
import { rankPriorityIssues } from "@/features/reports/services/priorityScoringService";

export function buildRewriteRecommendations(input: {
  rewrites: GapRewrites;
  scores: {
    clarityScore: number;
    pricingScore: number;
    confidenceScore: number;
    funnelRisk: number;
  };
}): RewriteRecommendation[] {
  const heroCopy = `${input.rewrites.hero.headline} ${input.rewrites.hero.subheadline} Primary CTA: ${input.rewrites.hero.primaryCta}${input.rewrites.hero.secondaryCta ? ` | Secondary CTA: ${input.rewrites.hero.secondaryCta}` : ""}`.trim();
  const pricingCopy = `Value metric: ${input.rewrites.pricing.valueMetric}. Anchor: ${input.rewrites.pricing.anchor}. Packaging: ${input.rewrites.pricing.packagingNotes.join(" | ")}`;
  const trustCopy = input.rewrites.differentiation.differentiators
    .map((item) => `${item.claim}: ${item.proof}`)
    .join(" | ");
  const objectionCopy = input.rewrites.objections.objections
    .map((item) => `${item.objection} -> ${item.response}`)
    .join(" | ");

  return [
    {
      title: "Homepage / hero",
      slug: "homepage-hero",
      iconName: "home",
      category: "Homepage / hero",
      metric: `Clarity ${input.scores.clarityScore}/100`,
      copy: heroCopy,
    },
    {
      title: "Pricing strategy",
      slug: "pricing-strategy",
      iconName: "pricing",
      category: "Pricing strategy",
      metric: `Pricing ${input.scores.pricingScore}/100`,
      copy: pricingCopy,
    },
    {
      title: "Trust & proof",
      slug: "trust-proof",
      iconName: "trust",
      category: "Trust & proof",
      metric: `Confidence ${input.scores.confidenceScore}/100`,
      copy: trustCopy,
    },
    {
      title: "Objection handling",
      slug: "objection-handling",
      iconName: "objection",
      category: "Objection handling",
      metric: `Funnel risk ${input.scores.funnelRisk}/100`,
      copy: objectionCopy,
    },
  ];
}

export function buildPriorityIndex(input: {
  gapAnalysis: GapAnalysisOutput;
  messagingOverlap: ConversionGapReport["messagingOverlap"];
  objectionCoverage: ConversionGapReport["objectionCoverage"];
}) {
  const avgCoverage = extractObjectionCoverageScore(input.objectionCoverage);
  const overlapPenalty = input.messagingOverlap.items.filter(
    (item) => item.risk === "high",
  ).length;

  const issues = [
    ...input.gapAnalysis.gaps.map((issue) => ({
      issue,
      impact: {
        revenueExposure: 70 + input.gapAnalysis.risks.length * 4,
        funnelStageImpact: 65,
        competitiveOverlap: 55 + overlapPenalty * 8,
        objectionWeakness: Math.max(20, 100 - avgCoverage),
      },
      effort: { scopeComplexity: 45, structuralChange: 40 },
    })),
    ...input.gapAnalysis.pricingClarityIssues.map((issue) => ({
      issue,
      impact: {
        revenueExposure: 68,
        funnelStageImpact: 62,
        competitiveOverlap: 58,
        objectionWeakness: Math.max(18, 100 - avgCoverage),
      },
      effort: { scopeComplexity: 38, structuralChange: 35 },
    })),
    ...input.gapAnalysis.differentiationGaps.map((issue) => ({
      issue,
      impact: {
        revenueExposure: 64,
        funnelStageImpact: 56,
        competitiveOverlap: 72,
        objectionWeakness: Math.max(16, 100 - avgCoverage),
      },
      effort: { scopeComplexity: 40, structuralChange: 44 },
    })),
  ] as PriorityInput[];

  return rankPriorityIssues(issues);
}
