import type { ConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";
import { modelRevenueImpact } from "@/features/conversion-gap/services/revenueModelingService";
import { calculateScore } from "@/features/conversion-gap/services/scoringEngine";
import {
  computeScores,
  mapThreatLevel,
  normalizeCompanyName,
  toSafeArray,
} from "@/features/conversion-gap/services/reportAggregationScoring";
import {
  buildExecutiveNarrative,
  buildMessagingOverlap,
  buildMessagingOverlapFromSynthesis,
  buildObjectionCoverage,
} from "@/features/conversion-gap/services/reportAggregationNarrative";
import {
  buildCompetitiveMatrix,
  buildCompetitiveMatrixFromSynthesis,
  buildPositioningMap,
} from "@/features/conversion-gap/services/reportAggregationCompetition";
import {
  buildPriorityIndex,
  buildRewriteRecommendations,
} from "@/features/conversion-gap/services/reportAggregationRecommendations";
import type { BuildConversionGapReportInput } from "@/features/conversion-gap/services/reportAggregation.types";

export function buildConversionGapReport(
  input: BuildConversionGapReportInput,
): ConversionGapReport {
  const company = normalizeCompanyName(input.company, input.websiteUrl);
  const scores = computeScores(input.gapAnalysis);
  const threatLevel = mapThreatLevel(scores.funnelRisk, scores.differentiationScore);
  const competitors = Array.isArray(input.competitorData.competitors)
    ? input.competitorData.competitors
    : [];

  const defaultMessagingOverlap = buildMessagingOverlap({
    overlapSignals: toSafeArray(input.gapAnalysis.messagingOverlap),
    competitors,
    funnelRisk: scores.funnelRisk,
  });
  const messagingOverlap = input.competitorSynthesis
    ? buildMessagingOverlapFromSynthesis({
        synthesis: input.competitorSynthesis,
        competitors,
        overlapSignals: toSafeArray(input.gapAnalysis.messagingOverlap),
      })
    : defaultMessagingOverlap;

  const objectionCoverage = buildObjectionCoverage({
    profile: input.profile,
    objections: input.rewrites.objections,
    missingObjections: input.gapAnalysis.missingObjections,
  });
  const baseCompetitiveMatrix = buildCompetitiveMatrix({
    profile: input.profile,
    competitors,
    differentiation: input.rewrites.differentiation,
    counters: input.rewrites.competitiveCounter,
  });
  const competitiveMatrix = input.competitorSynthesis
    ? buildCompetitiveMatrixFromSynthesis(
        input.competitorSynthesis,
        baseCompetitiveMatrix,
      )
    : baseCompetitiveMatrix;

  const positioningMap = buildPositioningMap({
    company,
    competitors,
    gapAnalysis: input.gapAnalysis,
    differentiationScore: scores.differentiationScore,
    clarityScore: scores.clarityScore,
    messagingOverlap: messagingOverlap.items,
  });
  const rewriteRecommendations = buildRewriteRecommendations({
    rewrites: input.rewrites,
    scores,
  });
  const priorityIndex = buildPriorityIndex({
    gapAnalysis: input.gapAnalysis,
    messagingOverlap,
    objectionCoverage,
  });
  const revenue = modelRevenueImpact({
    winRateDelta: scores.winRateDelta,
    funnelRisk: scores.funnelRisk,
    trafficBaseline: 1200,
    averageDealSize: 4000,
  });
  const executiveNarrative = buildExecutiveNarrative({
    company,
    segment: input.segment,
    gapAnalysis: input.gapAnalysis,
    scores,
  });

  const baseReport: ConversionGapReport = {
    id: input.reportId,
    company,
    segment: input.segment,
    status: input.status ?? "completed",
    createdAt: input.createdAt ?? new Date().toISOString(),
    conversionScore: scores.conversionScore,
    funnelRisk: scores.funnelRisk,
    winRateDelta: scores.winRateDelta,
    pipelineAtRisk: revenue.pipelineAtRisk,
    differentiationScore: scores.differentiationScore,
    pricingScore: scores.pricingScore,
    clarityScore: scores.clarityScore,
    confidenceScore: scores.confidenceScore,
    threatLevel,
    executiveNarrative,
    executiveSummary: executiveNarrative,
    messagingOverlap,
    objectionCoverage,
    competitiveMatrix,
    positioningMap: positioningMap as unknown as Record<string, unknown>,
    rewrites: input.rewrites as unknown as Record<string, unknown>,
    rewriteRecommendations,
    competitor_synthesis: input.competitorSynthesis,
    revenueImpact: {
      pipelineAtRisk: revenue.pipelineAtRisk,
      estimatedLiftPercent: revenue.revenueProjection.estimatedLiftPercent,
      modeledWinRateDelta: revenue.revenueProjection.modeledWinRateDelta,
      projectedPipelineRecovery: revenue.revenueProjection.projectedPipelineRecovery,
    },
    revenueProjection: revenue.revenueProjection,
    priorityIssues: priorityIndex,
    priorityIndex,
  };

  const modeledScore = calculateScore(baseReport);
  const modeledThreatLevel =
    modeledScore.revenueRiskLevel === "high" ||
    modeledScore.competitiveThreatLevel === "high"
      ? "high"
      : modeledScore.revenueRiskLevel === "medium" ||
          modeledScore.competitiveThreatLevel === "medium"
        ? "medium"
        : "low";

  return {
    ...baseReport,
    conversionScore: modeledScore.gapScore,
    threatLevel: modeledThreatLevel,
  };
}
