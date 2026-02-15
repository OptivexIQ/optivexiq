import type { ConversionGapReport } from "@/features/reports/types/report.types";

type RiskLevel = "low" | "medium" | "high";

const WEIGHTS = {
  clarity: 0.25,
  differentiation: 0.25,
  objectionCoverage: 0.2,
  pricing: 0.15,
  competitiveRisk: 0.15,
} as const;

function clamp(value: number): number {
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

function toRiskLevel(score: number): RiskLevel {
  if (score >= 70) {
    return "high";
  }
  if (score >= 40) {
    return "medium";
  }
  return "low";
}

export function calculateScore(report: ConversionGapReport): {
  gapScore: number;
  revenueRiskLevel: RiskLevel;
  competitiveThreatLevel: RiskLevel;
  scoringBreakdown: Record<string, number>;
} {
  const clarityScore = clamp(report.clarityScore);
  const differentiationScore = clamp(report.differentiationScore);
  const objectionScore = clamp(average(Object.values(report.objectionCoverage)));
  const pricingScore = clamp(report.pricingScore);

  const overlapAverage = clamp(
    average(report.messagingOverlap.items.map((item) => item.competitors)),
  );
  const competitiveRiskScore = clamp(100 - overlapAverage);

  const gapScore = clamp(
    clarityScore * WEIGHTS.clarity +
      differentiationScore * WEIGHTS.differentiation +
      objectionScore * WEIGHTS.objectionCoverage +
      pricingScore * WEIGHTS.pricing +
      competitiveRiskScore * WEIGHTS.competitiveRisk,
  );

  const revenueRiskSignal = clamp(100 - gapScore);
  const competitiveThreatSignal = clamp(100 - competitiveRiskScore);

  return {
    gapScore,
    revenueRiskLevel: toRiskLevel(revenueRiskSignal),
    competitiveThreatLevel: toRiskLevel(competitiveThreatSignal),
    scoringBreakdown: {
      clarity_score: clarityScore,
      differentiation_score: differentiationScore,
      objection_score: objectionScore,
      pricing_score: pricingScore,
      competitive_risk_score: competitiveRiskScore,
      weighted_gap_score: gapScore,
      revenue_risk_signal: revenueRiskSignal,
      competitive_threat_signal: competitiveThreatSignal,
    },
  };
}

