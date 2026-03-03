import type { ConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";
import { createHash } from "crypto";
import { modelRevenueImpact } from "@/features/conversion-gap/services/revenueModelingService";
import { calculateScore } from "@/features/conversion-gap/services/scoringEngine";
import {
  computeDeterministicObjectionCoverageScore,
  clampScore,
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
import {
  CANONICAL_RISK_MODEL_VERSION,
  CANONICAL_SCORING_WEIGHTS_VERSION,
} from "@/features/conversion-gap/services/scoringModelRegistry";
import { CANONICAL_TAXONOMY_VERSION } from "@/features/conversion-gap/services/taxonomyOverlapScoringService";
import { CURRENT_REPORT_SCHEMA_VERSION } from "@/features/reports/services/reportSchemaAdapterService";
import { POSITIONING_MAP_GENERATION_VERSION } from "@/features/differentiation-builder/services/positioningMapGenerationService";

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = (value ?? "").trim();
    if (normalized.length === 0) {
      continue;
    }
    if (seen.has(normalized.toLowerCase())) {
      continue;
    }
    seen.add(normalized.toLowerCase());
    out.push(normalized);
  }
  return out;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function buildEvidenceProvenance(params: {
  input: BuildConversionGapReportInput;
  report: ConversionGapReport;
}): NonNullable<ConversionGapReport["evidenceProvenance"]> {
  const modulePromptVersion = params.input.modelTelemetry?.modulePromptVersion ?? 1;
  const modelName = params.input.modelTelemetry?.modelName ?? "gpt-4o-mini";
  const modelTemperature = params.input.modelTelemetry?.modelTemperature ?? 0.2;
  const usageTotals = params.input.usageTotals;
  const tokenByModule = new Map(
    (usageTotals?.modules ?? []).map((moduleUsage) => [
      moduleUsage.name.toLowerCase(),
      moduleUsage.totalTokens,
    ]),
  );
  const homepageUrl =
    params.input.competitorData.homepage &&
    typeof params.input.competitorData.homepage === "object" &&
    "url" in (params.input.competitorData.homepage as Record<string, unknown>) &&
    typeof (params.input.competitorData.homepage as Record<string, unknown>).url ===
      "string"
      ? ((params.input.competitorData.homepage as Record<string, unknown>).url as string)
      : params.input.websiteUrl;
  const pricingUrl =
    params.input.competitorData.pricing &&
    typeof params.input.competitorData.pricing === "object" &&
    "url" in (params.input.competitorData.pricing as Record<string, unknown>) &&
    typeof (params.input.competitorData.pricing as Record<string, unknown>).url ===
      "string"
      ? ((params.input.competitorData.pricing as Record<string, unknown>).url as string)
      : null;
  const competitorUrls = (params.input.competitorData.competitors ?? [])
    .map((item) => item.url ?? "")
    .filter((url) => typeof url === "string" && url.trim().length > 0) as string[];

  const sources = [
    homepageUrl,
    ...(pricingUrl ? [pricingUrl] : []),
    ...competitorUrls.slice(0, 5),
  ];
  const evidenceSources = sources.map((url) => ({
    url,
    snippet_hash: sha256(url),
  }));
  const base = {
    evidence_sources: evidenceSources,
    evidence_hash: sha256(evidenceSources.map((item) => item.url)),
    module_prompt_version: modulePromptVersion,
    model_name: modelName,
    model_temperature: modelTemperature,
  };
  return {
    positioningClarity: {
      ...base,
      token_count: tokenByModule.get("gapanalysis") ?? 0,
    },
    objectionCoverage: {
      ...base,
      token_count: tokenByModule.get("objectionanalysis") ?? 0,
    },
    competitiveOverlap: {
      ...base,
      token_count:
        tokenByModule.get("competitorsynthesis") ??
        tokenByModule.get("competitivematrixsynthesis") ??
        0,
    },
    riskPrioritization: {
      ...base,
      token_count: tokenByModule.get("gapanalysis") ?? 0,
    },
    narrativeDiagnosis: {
      ...base,
      token_count:
        tokenByModule.get("differentiationbuilder") ??
        tokenByModule.get("competitorsynthesis") ??
        0,
    },
  };
}

function buildSectionHashes(params: {
  report: Omit<
    ConversionGapReport,
    "reproducibilityChecksum" | "sectionHashes" | "evidenceProvenance"
  >;
  input: BuildConversionGapReportInput;
}): Record<string, string> {
  return {
    positioning: sha256({
      input: {
        websiteUrl: params.input.websiteUrl,
        gapAnalysis: params.input.gapAnalysis,
      },
      output: {
        diagnosis: params.report.diagnosis,
        differentiationInsights: params.report.differentiationInsights,
      },
    }),
    objections: sha256({
      input: {
        profile: params.input.profile,
        objectionAnalysis: params.input.objectionAnalysis,
      },
      output: params.report.objectionCoverage,
    }),
    differentiation: sha256({
      input: {
        positioningAnalysis: params.input.positioningAnalysis,
        competitorSynthesis: params.input.competitorSynthesis,
      },
      output: {
        competitiveInsights: params.report.competitiveInsights,
        competitor_synthesis: params.report.competitor_synthesis,
      },
    }),
    scoring: sha256({
      input: params.input.gapAnalysis,
      output: {
        scoringBreakdown: params.report.scoringBreakdown,
        conversionScore: params.report.conversionScore,
      },
    }),
    narrative: sha256({
      input: {
        competitors: params.input.competitorData.competitors?.map((item) => item.name),
      },
      output: {
        executiveNarrative: params.report.executiveNarrative,
        executiveSummary: params.report.executiveSummary,
      },
    }),
  };
}

function deriveSectionConfidence(params: {
  competitors: Array<{ name: string }>;
  overlapCount: number;
  objectionCoverage: ConversionGapReport["objectionCoverage"];
  differentiationInsights: ConversionGapReport["differentiationInsights"];
  scores: ReturnType<typeof computeScores>;
  executiveNarrative: string;
}): ConversionGapReport["sectionConfidence"] {
  const competitorSignal = Math.min(1, params.competitors.length / 3);
  const overlapSignal = Math.min(1, params.overlapCount / 3);
  const objectionSignal = Math.min(
    1,
    (params.objectionCoverage.identified.length +
      params.objectionCoverage.guidance.length) /
      6,
  );
  const differentiationSignal = Math.min(
    1,
    (params.differentiationInsights.overlapAreas.length +
      params.differentiationInsights.opportunities.length +
      params.differentiationInsights.parityRisks.length) /
      8,
  );
  const narrativeSignal = Math.min(
    1,
    params.executiveNarrative.trim().length / 220,
  );

  return {
    positioning: clampScore((competitorSignal * 0.5 + differentiationSignal * 0.5) * 100),
    objections: clampScore((objectionSignal * 0.7 + competitorSignal * 0.3) * 100),
    differentiation: clampScore(
      (differentiationSignal * 0.65 + competitorSignal * 0.35) * 100,
    ),
    scoring: clampScore(
      (overlapSignal * 0.35 +
        competitorSignal * 0.25 +
        params.scores.confidenceScore / 100 * 0.4) *
        100,
    ),
    narrative: clampScore((narrativeSignal * 0.6 + params.scores.confidenceScore / 100 * 0.4) * 100),
  };
}

function deriveCompetitiveSection(
  synthesis: BuildConversionGapReportInput["competitorSynthesis"] | undefined,
): ConversionGapReport["competitive_section"] {
  const overlaps = synthesis?.overlapByCompetitor ?? [];
  const averageDensity =
    overlaps.length > 0
      ? overlaps.reduce((acc, item) => acc + item.signal_density, 0) / overlaps.length
      : 0;
  if (overlaps.length === 0) {
    return {
      status: "insufficient_signal",
      reason_code: "insufficient_competitor_coverage",
      evidence: [],
      evidence_count: 0,
      signal_density_score: 0,
      extraction_confidence: 0,
    };
  }
  if (averageDensity < 20) {
    return {
      status: "insufficient_signal",
      reason_code: "insufficient_overlap_density",
      evidence: [],
      evidence_count: 0,
      signal_density_score: clampScore(averageDensity),
      extraction_confidence: clampScore(averageDensity),
    };
  }

  const evidence = overlaps
    .slice(0, 5)
    .map(
      (item) =>
        `${item.competitor}: aggregate=${item.aggregate_overlap}, signal=${item.signal_density}`,
    );
  const averageSignalDensity =
    overlaps.reduce((acc, item) => acc + item.signal_density, 0) / overlaps.length;
  return {
    status: "ready",
    reason_code: null,
    evidence,
    evidence_count: evidence.length,
    signal_density_score: clampScore(averageSignalDensity),
    extraction_confidence: clampScore(averageSignalDensity),
  };
}

function buildDiagnosticEvidence(params: {
  report: ConversionGapReport;
  competitors: Array<{ name: string }>;
}): ConversionGapReport["diagnosticEvidence"] {
  const competitorNames = uniqueNonEmpty(params.competitors.map((item) => item.name));
  const derivedFromBase =
    competitorNames.length > 0
      ? ["homepage", "pricing", ...competitorNames.slice(0, 3)]
      : ["homepage", "pricing"];
  const overlapExamples = params.report.messagingOverlap.items
    .slice(0, 3)
    .map((item) => `${item.competitor}: overlap ${item.competitors}% (${item.risk} risk)`);
  const objectionExamples = uniqueNonEmpty([
    ...params.report.objectionCoverage.missing.slice(0, 2).map((item) => item.objection),
    ...params.report.objectionCoverage.identified
      .slice(0, 2)
      .map((item) => item.evidence ?? item.objection),
  ]);
  const differentiationExamples = uniqueNonEmpty([
    ...params.report.differentiationInsights.overlapAreas.slice(0, 2),
    ...params.report.differentiationInsights.parityRisks.slice(0, 2),
  ]);
  const scoringExamples = uniqueNonEmpty([
    `Funnel risk ${params.report.funnelRisk}/100`,
    `Differentiation score ${params.report.differentiationScore}/100`,
    `Confidence score ${params.report.confidenceScore}/100`,
  ]);
  const narrativeExamples = uniqueNonEmpty([
    params.report.diagnosis.primaryGap,
    params.report.diagnosis.primaryRisk,
    params.report.diagnosis.primaryOpportunity,
  ]);

  return {
    positioningClarity: [
      {
        claim: params.report.diagnosis.primaryGap,
        evidence:
          differentiationExamples.length > 0
            ? differentiationExamples
            : ["signal_insufficient_differentiation_evidence"],
        derivedFrom: derivedFromBase,
        confidenceScore: params.report.sectionConfidence.positioning,
      },
    ],
    objectionCoverage: [
      {
        claim:
          params.report.objectionCoverage.risks[0] ??
          "Objection coverage requires stronger decision-stage proof.",
        evidence:
          objectionExamples.length > 0
            ? objectionExamples
            : ["signal_insufficient_objection_evidence"],
        derivedFrom: derivedFromBase,
        confidenceScore: params.report.sectionConfidence.objections,
      },
    ],
    competitiveOverlap: [
      {
        claim: params.report.messagingOverlap.insight,
        evidence:
          overlapExamples.length > 0
            ? overlapExamples
            : ["competitive_signal_insufficient"],
        derivedFrom: competitorNames.length > 0 ? competitorNames.slice(0, 3) : ["homepage"],
        confidenceScore: params.report.sectionConfidence.differentiation,
      },
    ],
    riskPrioritization: [
      {
        claim: params.report.diagnosis.primaryRisk,
        evidence: scoringExamples,
        derivedFrom: ["homepage", ...(competitorNames.slice(0, 2) || [])],
        confidenceScore: params.report.sectionConfidence.scoring,
      },
    ],
    narrativeDiagnosis: [
      {
        claim: params.report.diagnosis.summary,
        evidence:
          narrativeExamples.length > 0
            ? narrativeExamples
            : ["signal_insufficient_narrative_evidence"],
        derivedFrom: derivedFromBase,
        confidenceScore: params.report.sectionConfidence.narrative,
      },
    ],
  };
}

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

  if (
    !input.competitorSynthesis.companyTaxonomy ||
    !Array.isArray(input.competitorSynthesis.competitorTaxonomies) ||
    input.competitorSynthesis.competitorTaxonomies.length === 0 ||
    !Array.isArray(input.competitorSynthesis.overlapByCompetitor) ||
    input.competitorSynthesis.overlapByCompetitor.length === 0 ||
    !input.competitorSynthesis.dimensionalOverlap
  ) {
    throw new Error("incomplete_competitor_synthesis_for_completed_report");
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

  const messagingOverlap = input.competitorSynthesis
    ? buildMessagingOverlapFromSynthesis({
        synthesis: input.competitorSynthesis,
        competitors,
        overlapSignals: toSafeArray(input.gapAnalysis.messagingOverlap),
        competitiveMatrixOverride: input.competitiveMatrixOverride,
      })
    : buildMessagingOverlap({
        overlapSignals: toSafeArray(input.gapAnalysis.messagingOverlap),
        competitors,
        funnelRisk: scores.funnelRisk,
        competitiveMatrixOverride: input.competitiveMatrixOverride,
      });

  const objectionCoverage = input.objectionAnalysis
    ? {
        score: computeDeterministicObjectionCoverageScore(input.objectionAnalysis),
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
    competitorSynthesis: input.competitorSynthesis,
    scores,
    revenueImpact: {
      pipelineAtRisk: revenue.pipelineAtRisk,
      projectedPipelineRecovery: revenue.revenueProjection.projectedPipelineRecovery,
    },
  });
  const diagnosis = buildDiagnosis({
    gapAnalysis: input.gapAnalysis,
    executiveNarrative,
  });
  const sectionConfidence = deriveSectionConfidence({
    competitors,
    overlapCount: messagingOverlap.items.length,
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
          recommendedPositioningDirection: {
            direction: "",
            rationale: "",
            supportingEvidence: [],
            confidence: 0,
            actionPriority: "P2",
          },
        },
    scores,
    executiveNarrative,
  });

  const baseReport: ConversionGapReport = {
    reportSchemaVersion: CURRENT_REPORT_SCHEMA_VERSION,
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
    riskModelVersion: CANONICAL_RISK_MODEL_VERSION,
    taxonomyVersion:
      input.competitorSynthesis?.taxonomyVersion ?? CANONICAL_TAXONOMY_VERSION,
    scoringWeightsVersion: CANONICAL_SCORING_WEIGHTS_VERSION,
    positioningMapGenerationVersion: POSITIONING_MAP_GENERATION_VERSION,
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
    sectionConfidence,
    diagnosticEvidence: {
      positioningClarity: [],
      objectionCoverage: [],
      competitiveOverlap: [],
      riskPrioritization: [],
      narrativeDiagnosis: [],
    },
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
          recommendedPositioningDirection: {
            direction: "",
            rationale: "",
            supportingEvidence: [],
            confidence: 0,
            actionPriority: "P2",
          },
        },
    competitiveInsights: input.positioningAnalysis
      ? input.positioningAnalysis.competitiveInsights
      : [],
    competitiveMatrix: normalizedCompetitiveMatrix,
    positioningMap: positioningMap as unknown as Record<string, unknown>,
    rewrites: input.rewrites as unknown as Record<string, unknown>,
    rewriteRecommendations,
    competitive_section: deriveCompetitiveSection(input.competitorSynthesis),
    competitor_synthesis: input.competitorSynthesis ?? {
      coreDifferentiationTension: "",
      messagingOverlapRisk: {
        level: "moderate",
        explanation: "",
      },
      substitutionRiskNarrative: "",
      counterPositioningVector: "",
      pricingDefenseNarrative: "",
      overlapDensity: 0,
      referencedTaxonomyIds: [],
      referencedOverlapDimensionIds: [],
      whiteSpaceRulesApplied: [],
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
  const reportWithScore = {
    ...baseReport,
    conversionScore: modeledScore.gapScore,
    threatLevel: modeledScore.overallThreatLevel,
    scoringModelVersion: modeledScore.scoringModelVersion,
    scoringBreakdown: modeledScore.scoringBreakdown,
  };
  const diagnosticEvidence = buildDiagnosticEvidence({
    report: reportWithScore,
    competitors,
  });

  const reportWithEvidence = {
    ...reportWithScore,
    diagnosticEvidence,
  };
  const sectionHashes = buildSectionHashes({
    report: reportWithEvidence,
    input,
  });
  const evidenceProvenance = buildEvidenceProvenance({
    input,
    report: reportWithEvidence,
  });
  const reproducibilityChecksum = sha256({
    reportId: input.reportId,
    createdAt: input.createdAt,
    input: {
      gapAnalysis: input.gapAnalysis,
      rewrites: input.rewrites,
      competitorSynthesis: input.competitorSynthesis,
      objectionAnalysis: input.objectionAnalysis,
      positioningAnalysis: input.positioningAnalysis,
      profile: input.profile,
    },
    sectionHashes,
  });

  return {
    ...reportWithEvidence,
    sectionHashes,
    evidenceProvenance,
    reproducibilityChecksum,
  };
}
