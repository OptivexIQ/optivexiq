import type { GapAnalysisOutput } from "@/features/conversion-gap/types/gap.types";
import type { ObjectionAnalysisOutput } from "@/features/objection-engine/ai/objectionAnalysisModule";

export function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function toSafeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function computeScores(gapAnalysis: GapAnalysisOutput) {
  const gaps = gapAnalysis.gaps.length;
  const risks = gapAnalysis.risks.length;
  const pricingIssues = gapAnalysis.pricingClarityIssues.length;
  const missingObjections = gapAnalysis.missingObjections.length;
  const differentiationGaps = gapAnalysis.differentiationGaps.length;
  const opportunities = gapAnalysis.opportunities.length;

  const conversionScore = clampScore(
    100 - gaps * 7 - risks * 6 - pricingIssues * 4 - missingObjections * 3,
  );
  const funnelRisk = clampScore(risks * 18 + gaps * 9 + missingObjections * 6);
  const differentiationScore = clampScore(
    100 - differentiationGaps * 14 - Math.max(0, opportunities - 3) * 2,
  );
  const pricingScore = clampScore(100 - pricingIssues * 14);
  const clarityScore = clampScore(100 - gaps * 11 - pricingIssues * 4);
  const confidenceScore = clampScore(
    100 - missingObjections * 10 - risks * 5 - differentiationGaps * 3,
  );
  const winRateDelta = clampScore(
    Math.max(0, opportunities * 5 - risks * 3 - missingObjections * 2),
  );

  return {
    conversionScore,
    funnelRisk,
    differentiationScore,
    pricingScore,
    clarityScore,
    confidenceScore,
    winRateDelta,
  };
}

export function normalizeCompanyName(company: string, websiteUrl: string) {
  const fromInput = company.trim();
  if (fromInput.length > 0) {
    return fromInput;
  }

  try {
    return new URL(websiteUrl).hostname.replace(/^www\./i, "");
  } catch {
    throw new Error("company_resolution_failed");
  }
}

function severityWeight(value: "low" | "medium" | "high" | "critical"): number {
  if (value === "critical") {
    return 1;
  }
  if (value === "high") {
    return 0.75;
  }
  if (value === "medium") {
    return 0.5;
  }
  return 0.25;
}

export function computeDeterministicObjectionCoverageScore(
  analysis: Pick<
    ObjectionAnalysisOutput,
    "identifiedObjections" | "missingObjections" | "mitigationGuidance"
  >,
): number {
  const identifiedCount = analysis.identifiedObjections.length;
  const missingCount = analysis.missingObjections.length;
  const total = identifiedCount + missingCount;

  if (total <= 0) {
    return 0;
  }

  const baseCoverage = (identifiedCount / total) * 100;
  const weightedMissing =
    analysis.missingObjections.length > 0
      ? analysis.missingObjections.reduce(
          (sum, item) => sum + severityWeight(item.severity),
          0,
        ) / analysis.missingObjections.length
      : 0;
  const missingPenalty = weightedMissing * 30;
  const mitigationBonus = Math.min(12, analysis.mitigationGuidance.length * 2);

  return clampScore(baseCoverage - missingPenalty + mitigationBonus);
}
