import type { ConversionGapReport } from "@/features/reports/types/report.types";
import type { FreeConversionSnapshot } from "@/features/free-snapshot/types/freeSnapshot.types";
import { getFreeSnapshotById } from "@/features/free-snapshot/services/freeSnapshotRepository";
import { freeConversionSnapshotSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";
import { generateSnapshotPdf } from "@/features/free-snapshot/pdf/generateSnapshotPdf";
import { calculateScore } from "@/features/conversion-gap/services/scoringEngine";
import {
  CANONICAL_RISK_MODEL_VERSION,
  CANONICAL_SCORING_MODEL_VERSION,
  CANONICAL_SCORING_WEIGHTS_VERSION,
} from "@/features/conversion-gap/services/scoringModelRegistry";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";
import { CANONICAL_TAXONOMY_VERSION } from "@/features/conversion-gap/services/taxonomyOverlapScoringService";
import { CURRENT_REPORT_SCHEMA_VERSION } from "@/features/reports/services/reportSchemaAdapterService";

function toCanonicalReport(
  snapshotId: string,
  websiteUrl: string,
  snapshot: FreeConversionSnapshot,
): ConversionGapReport {
  const createdAt = new Date().toISOString();
  const gapA = snapshot.topMessagingGap;
  const gapB = snapshot.topObjectionGap;
  const score = Math.round((snapshot.clarityScore + snapshot.positioningScore) / 2);
  const insufficientEvidence =
    "insufficient signal depth: structured evidence is unavailable for this field.";
  const baseReport: ConversionGapReport = {
    reportSchemaVersion: CURRENT_REPORT_SCHEMA_VERSION,
    canonicalSchemaVersion: CANONICAL_REPORT_SCHEMA_VERSION,
    id: snapshotId,
    company: websiteUrl,
    segment: "SaaS",
    status: "completed",
    createdAt,
    conversionScore: score,
    funnelRisk: Math.max(0, 100 - score),
    winRateDelta: Math.round(snapshot.positioningScore * 0.12),
    pipelineAtRisk: 0,
    differentiationScore: snapshot.positioningScore,
    pricingScore: score,
    clarityScore: snapshot.clarityScore,
    confidenceScore: score,
    threatLevel: "low",
    scoringModelVersion: CANONICAL_SCORING_MODEL_VERSION,
    riskModelVersion: CANONICAL_RISK_MODEL_VERSION,
    taxonomyVersion: CANONICAL_TAXONOMY_VERSION,
    scoringWeightsVersion: CANONICAL_SCORING_WEIGHTS_VERSION,
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
    executiveNarrative: snapshot.executiveSummary,
    executiveSummary: snapshot.executiveSummary,
    diagnosis: {
      summary: snapshot.executiveSummary,
      primaryGap: gapA,
      primaryRisk: snapshot.riskEstimate,
      primaryOpportunity: snapshot.quickWins[0] ?? "Apply quick wins to reduce conversion friction.",
    },
    sectionConfidence: {
      positioning: score,
      objections: Math.max(
        0,
        100 - Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2),
      ),
      differentiation: snapshot.positioningScore,
      scoring: score,
      narrative: Math.min(100, Math.max(0, Math.round(snapshot.executiveSummary.length / 2))),
    },
    diagnosticEvidence: {
      positioningClarity: [
        {
          claim: gapA,
          evidence: [snapshot.topMessagingGap],
          derivedFrom: ["homepage"],
          confidenceScore: snapshot.positioningScore,
        },
      ],
      objectionCoverage: [
        {
          claim: snapshot.topObjectionGap,
          evidence: [snapshot.riskEstimate],
          derivedFrom: ["homepage"],
          confidenceScore: Math.max(
            0,
            100 - Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2),
          ),
        },
      ],
      competitiveOverlap: [
        {
          claim: snapshot.topMessagingGap,
          evidence: [snapshot.riskEstimate],
          derivedFrom: ["homepage"],
          confidenceScore: score,
        },
      ],
      riskPrioritization: [
        {
          claim: snapshot.riskEstimate,
          evidence: [snapshot.topMessagingGap, snapshot.topObjectionGap],
          derivedFrom: ["homepage"],
          confidenceScore: score,
        },
      ],
      narrativeDiagnosis: [
        {
          claim: snapshot.executiveSummary,
          evidence: [snapshot.executiveSummary],
          derivedFrom: ["homepage"],
          confidenceScore: score,
        },
      ],
    },
    messagingOverlap: {
      items: [],
      insight: snapshot.topMessagingGap,
      ctaLabel: "Upgrade for full overlap analysis",
    },
    objectionCoverage: {
      score: Math.max(
        0,
        100 - Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2),
      ),
      identified: [],
      missing: [
        {
          objection: gapB,
          severity: "medium",
          impact: snapshot.riskEstimate,
        },
      ],
      risks: [gapB],
      guidance: [
        {
          objection: gapB,
          recommendedStrategy:
            snapshot.quickWins[0] ?? "Address this objection with outcome-backed proof.",
        },
      ],
      dimensionScores: {
        "primary-objection": Math.max(
          0,
          100 - Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2),
        ),
      },
    },
    differentiationInsights: {
      similarityScore: Math.max(
        0,
        Math.min(100, Math.round((snapshot.positioningScore + snapshot.clarityScore) / 2)),
      ),
      overlapAreas: [snapshot.topMessagingGap].filter(
        (value) => value.trim().length > 0,
      ),
      opportunities: snapshot.quickWins.slice(0, 3).map((item, index) => ({
        theme: `Snapshot opportunity ${index + 1}`,
        rationale: item,
        implementationDifficulty: "low" as const,
        expectedImpact: "medium" as const,
      })),
      strategyRecommendations: snapshot.quickWins.slice(0, 3),
      parityRisks: [snapshot.riskEstimate].filter(
        (value) => value.trim().length > 0,
      ),
      strategicNarrativeDifferences: [
        {
          difference: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      underservedPositioningTerritories: [
        {
          territory: "insufficient data",
          rationale: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      credibleDifferentiationAxes: [
        {
          axis: "insufficient data",
          rationale: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      marketPerceptionRisks: [
        {
          risk: "insufficient data",
          whyItMatters: "insufficient data",
          evidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
          confidence: 0,
          actionPriority: "P2",
        },
      ],
      recommendedPositioningDirection: {
        direction: "insufficient data",
        rationale: "insufficient data",
        supportingEvidence: [{ competitor: "insufficient data", snippet: insufficientEvidence }],
        confidence: 0,
        actionPriority: "P2",
      },
    },
    competitiveInsights: [
      {
        claim: `Primary competitive risk: ${snapshot.topMessagingGap}`,
        evidence: [
          {
            competitor: "snapshot_signal",
            snippet: snapshot.riskEstimate,
          },
        ],
        reasoning:
          "Snapshot mode stores limited competitor context, so this insight reflects top captured risk wording only.",
        confidence: 0.45,
        actionPriority: "P2",
      },
    ],
    competitor_synthesis: {
      coreDifferentiationTension: "insufficient data",
      messagingOverlapRisk: { level: "moderate", explanation: "insufficient data" },
      substitutionRiskNarrative: "insufficient data",
      counterPositioningVector: "insufficient data",
      pricingDefenseNarrative: "insufficient data",
    },
    competitiveMatrix: { profileMatrix: [], competitorRows: [], differentiators: [], counters: [] },
    positioningMap: {},
    rewrites: {},
    rewriteRecommendations: snapshot.quickWins.map((win, index) => ({
      title: `Quick Win ${index + 1}`,
      slug: `quick-win-${index + 1}`,
      category: "Free Conversion Audit",
      metric: "Estimated conversion lift",
      copy: win,
      iconName: "default",
    })),
    competitive_section: {
      status: "ready",
      reason_code: null,
      evidence: ["snapshot: limited competitive evidence set"],
      evidence_count: 1,
      signal_density_score: 35,
      extraction_confidence: 35,
    },
    revenueImpact: {
      pipelineAtRisk: 0,
      estimatedLiftPercent: Math.max(5, Math.round(snapshot.clarityScore * 0.15)),
      modeledWinRateDelta: Math.max(2, Math.round(snapshot.positioningScore * 0.08)),
      projectedPipelineRecovery: 0,
    },
    revenueProjection: {
      estimatedLiftPercent: Math.max(5, Math.round(snapshot.clarityScore * 0.15)),
      modeledWinRateDelta: Math.max(2, Math.round(snapshot.positioningScore * 0.08)),
      projectedPipelineRecovery: 0,
    },
    priorityIssues: [
      {
        issue: gapA,
        impactScore: 90,
        effortEstimate: 35,
        priorityScore: 78,
        tier: "Critical",
      },
      {
        issue: gapB,
        impactScore: 80,
        effortEstimate: 40,
        priorityScore: 70,
        tier: "High",
      },
      {
        issue: snapshot.riskEstimate,
        impactScore: 68,
        effortEstimate: 34,
        priorityScore: 62,
        tier: "Medium",
      },
    ],
    priorityIndex: [],
  };

  const modeled = calculateScore(baseReport);
  return {
    ...baseReport,
    conversionScore: modeled.gapScore,
    threatLevel: modeled.overallThreatLevel,
    scoringModelVersion: modeled.scoringModelVersion,
    scoringBreakdown: modeled.scoringBreakdown,
  };
}

export async function generateFreeSnapshotDownload(input: {
  snapshotId: string;
  email: string;
}) {
  const row = await getFreeSnapshotById(input.snapshotId);
  if (!row) {
    return { ok: false as const, status: 404, error: "Snapshot not found." };
  }

  if (row.status !== "completed") {
    return {
      ok: false as const,
      status: 409,
      error: "Snapshot is not completed yet.",
    };
  }

  const parsed = freeConversionSnapshotSchema.safeParse(row.snapshot_data);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 500,
      error: "Stored snapshot data is invalid.",
    };
  }

  const report = toCanonicalReport(row.id, row.website_url, parsed.data);
  const pdf = await generateSnapshotPdf({
    report,
    brand: {
      logoUrl: "https://optivexiq.com/logo.png",
      primaryColor: "#0f172a",
      accentColor: "#0ea5e9",
    },
    generatedAt: new Date().toISOString(),
  });

  return {
    ok: true as const,
    pdf,
    filename: "OptivexIQ-Snapshot.pdf",
    website: row.website_url,
    snapshotId: row.id,
  };
}
