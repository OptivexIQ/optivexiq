import type { ConversionGapReport } from "@/features/reports/types/report.types";

export type ScoringModel = {
  clarityWeight: number;
  differentiationWeight: number;
  objectionCoverageWeight: number;
  competitiveOverlapWeight: number;
  pricingExposureWeight: number;
};

type ThreatLevel = "low" | "medium" | "high";

const DEFAULT_SCORING_MODEL: ScoringModel = {
  clarityWeight: 0.24,
  differentiationWeight: 0.24,
  objectionCoverageWeight: 0.2,
  competitiveOverlapWeight: 0.16,
  pricingExposureWeight: 0.16,
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toThreatLevel(value: number): ThreatLevel {
  if (value >= 70) {
    return "high";
  }
  if (value >= 40) {
    return "medium";
  }
  return "low";
}

export function calculateScore(
  report: ConversionGapReport,
  model: ScoringModel = DEFAULT_SCORING_MODEL,
): {
  gapScore: number;
  revenueRiskLevel: ThreatLevel;
  competitiveThreatLevel: ThreatLevel;
  scoringBreakdown: Record<string, number>;
} {
  const objectionAverage = clampScore(average(Object.values(report.objectionCoverage)));
  const overlapAverage = clampScore(
    average(report.messagingOverlap.items.map((item) => item.competitors)),
  );
  const overlapHealth = clampScore(100 - overlapAverage);
  const pricingHealth = clampScore(report.pricingScore);
  const clarityHealth = clampScore(report.clarityScore);
  const differentiationHealth = clampScore(report.differentiationScore);

  const weightedScore =
    clarityHealth * model.clarityWeight +
    differentiationHealth * model.differentiationWeight +
    objectionAverage * model.objectionCoverageWeight +
    overlapHealth * model.competitiveOverlapWeight +
    pricingHealth * model.pricingExposureWeight;

  const gapScore = clampScore(weightedScore);
  const pipelineRiskSignal =
    report.pipelineAtRisk > 0
      ? clampScore(Math.min(100, report.pipelineAtRisk / 10000))
      : 0;
  const revenueRiskSignal = clampScore(
    Math.round((100 - gapScore) * 0.8 + pipelineRiskSignal * 0.2),
  );
  const competitiveThreatSignal = clampScore(
    Math.round(overlapAverage * 0.6 + (100 - differentiationHealth) * 0.4),
  );

  return {
    gapScore,
    revenueRiskLevel: toThreatLevel(revenueRiskSignal),
    competitiveThreatLevel: toThreatLevel(competitiveThreatSignal),
    scoringBreakdown: {
      clarity: clarityHealth,
      differentiation: differentiationHealth,
      objectionCoverage: objectionAverage,
      competitiveOverlap: overlapAverage,
      pricingExposure: clampScore(100 - pricingHealth),
      weightedScore: gapScore,
      revenueRiskSignal,
      competitiveThreatSignal,
    },
  };
}

