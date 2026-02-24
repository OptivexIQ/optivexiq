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
import type { CompetitiveMatrix } from "@/features/conversion-gap/types/conversionGapReport.types";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";

function assertCompletedReportInputs(
  input: BuildConversionGapReportInput,
  status: ConversionGapReport["status"],
): void {
  if (status !== "completed") {
    return;
  }

  if (!input.objectionAnalysis) {
    throw new Error("missing_objection_analysis_for_completed_report");
  }

  if (!input.positioningAnalysis) {
    throw new Error("missing_positioning_analysis_for_completed_report");
  }

  if (!input.competitorSynthesis) {
    throw new Error("missing_competitor_synthesis_for_completed_report");
  }
}

function applyCompetitiveMatrixOverride(
  base: CompetitiveMatrix,
  override?: BuildConversionGapReportInput["competitiveMatrixOverride"],
): CompetitiveMatrix {
  if (!override) {
    return base;
  }

  const profileMatrix = override.rows.flatMap((row) =>
    row.competitors.map((competitor) => ({
      competitor: competitor.name,
      ourAdvantage: `${row.dimension}: ${row.you}`,
      theirAdvantage: `${row.dimension}: ${competitor.value}`,
    })),
  );

  const competitorRows = override.rows.reduce<
    CompetitiveMatrix["competitorRows"]
  >((acc, row) => {
    for (const competitor of row.competitors) {
      const existing = acc.find(
        (item) => item.competitor.toLowerCase() === competitor.name.toLowerCase(),
      );
      if (!existing) {
        acc.push({
          competitor: competitor.name,
          summary: competitor.evidence,
          strengths: [],
          weaknesses: [],
          positioning: [`${row.dimension}: ${competitor.value}`],
        });
        continue;
      }
      if (existing.summary.length === 0 && competitor.evidence.length > 0) {
        existing.summary = competitor.evidence;
      }
      existing.positioning.push(`${row.dimension}: ${competitor.value}`);
    }
    return acc;
  }, []);

  return {
    ...base,
    profileMatrix,
    competitorRows,
  };
}

export function buildConversionGapReport(
  input: BuildConversionGapReportInput,
): ConversionGapReport {
  const reportStatus = input.status ?? "completed";
  assertCompletedReportInputs(input, reportStatus);
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
  const normalizedCompetitiveMatrix = applyCompetitiveMatrixOverride(
    competitiveMatrix,
    input.competitiveMatrixOverride,
  );

  const positioningMap =
    input.positioningMapOverride ??
    buildPositioningMap({
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
    canonicalSchemaVersion: CANONICAL_REPORT_SCHEMA_VERSION,
    id: input.reportId,
    company,
    segment: input.segment,
    status: reportStatus,
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
    differentiationInsights: input.positioningAnalysis
      ? {
          similarityScore: input.positioningAnalysis.narrativeSimilarityScore,
          overlapAreas: input.positioningAnalysis.overlapAreas,
          opportunities: input.positioningAnalysis.differentiationOpportunities,
          strategyRecommendations:
            input.positioningAnalysis.positioningStrategyRecommendations,
          parityRisks: input.positioningAnalysis.highRiskParityZones,
          strategicNarrativeDifferences:
            input.positioningAnalysis.strategicNarrativeDifferences,
          underservedPositioningTerritories:
            input.positioningAnalysis.underservedPositioningTerritories,
          credibleDifferentiationAxes:
            input.positioningAnalysis.credibleDifferentiationAxes,
          marketPerceptionRisks: input.positioningAnalysis.marketPerceptionRisks,
          recommendedPositioningDirection:
            input.positioningAnalysis.recommendedPositioningDirection,
        }
      : {
          similarityScore: 0,
          overlapAreas: [],
          opportunities: [],
          strategyRecommendations: [],
          parityRisks: [],
          strategicNarrativeDifferences: [],
          underservedPositioningTerritories: [],
          credibleDifferentiationAxes: [],
          marketPerceptionRisks: [],
        },
    competitiveInsights: input.positioningAnalysis
      ? input.positioningAnalysis.competitiveInsights
      : [],
    competitiveMatrix: normalizedCompetitiveMatrix,
    positioningMap: positioningMap as unknown as Record<string, unknown>,
    rewrites: input.rewrites as unknown as Record<string, unknown>,
    rewriteRecommendations,
    competitor_synthesis: input.competitorSynthesis ?? {
      coreDifferentiationTension: "",
      messagingOverlapRisk: {
        level: "moderate",
        explanation: "",
      },
      substitutionRiskNarrative: "",
      counterPositioningVector: "",
      pricingDefenseNarrative: "",
    },
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
