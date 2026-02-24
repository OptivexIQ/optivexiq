import type { ConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";
import { modelRevenueImpact } from "@/features/conversion-gap/services/revenueModelingService";
import { calculateScore } from "@/features/conversion-gap/services/scoringEngine";
import {
  computeScores,
  normalizeCompanyName,
  toSafeArray,
} from "@/features/conversion-gap/services/reportAggregationScoring";
import {
  buildDiagnosis,
  buildExecutiveNarrative,
  buildMessagingOverlap,
  buildMessagingOverlapFromSynthesis,
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

  const objectionCoverage = input.objectionAnalysis
    ? {
        score: input.objectionAnalysis.objectionCoverageScore,
        identified: input.objectionAnalysis.identifiedObjections.map((item) => ({
          objection: item.objection,
          severity: item.severity,
          evidence: item.evidence,
        })),
        missing: input.objectionAnalysis.missingObjections.map((item) => ({
          objection: item.objection,
          severity: item.severity,
          impact: item.impact,
        })),
        risks: [...input.objectionAnalysis.criticalRisks],
        guidance: input.objectionAnalysis.mitigationGuidance.map((item) => ({
          objection: item.objection,
          recommendedStrategy: item.recommendedStrategy,
        })),
      }
    : {
        score: 0,
        identified: [],
        missing: [],
        risks: [],
        guidance: [],
      };
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
  const diagnosis = buildDiagnosis({
    gapAnalysis: input.gapAnalysis,
    executiveNarrative,
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
    threatLevel: "low",
    scoringModelVersion: "",
    scoringBreakdown: {
      clarity: 0,
      differentiation: 0,
      objectionCoverage: 0,
      competitiveOverlap: 0,
      pricingExposure: 0,
      weightedScore: 0,
      revenueRiskSignal: 0,
      competitiveThreatSignal: 0,
    },
    executiveNarrative,
    executiveSummary: executiveNarrative,
    diagnosis,
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

  return {
    ...baseReport,
    conversionScore: modeledScore.gapScore,
    threatLevel: modeledScore.overallThreatLevel,
    scoringModelVersion: modeledScore.scoringModelVersion,
    scoringBreakdown: modeledScore.scoringBreakdown,
  };
}
