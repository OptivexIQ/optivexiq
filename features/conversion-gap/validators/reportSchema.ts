import { z } from "zod";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";

export const conversionGapReportSchema = z.object({
  canonicalSchemaVersion: z.literal(CANONICAL_REPORT_SCHEMA_VERSION),
  id: z.string(),
  company: z.string(),
  segment: z.string(),
  conversionScore: z.number(),
  funnelRisk: z.number(),
  winRateDelta: z.number(),
  pipelineAtRisk: z.number(),
  differentiationScore: z.number(),
  pricingScore: z.number(),
  clarityScore: z.number(),
  confidenceScore: z.number(),
  scoringModelVersion: z.string().min(1),
  scoringBreakdown: z.object({
    clarity: z.number(),
    differentiation: z.number(),
    objectionCoverage: z.number(),
    competitiveOverlap: z.number(),
    pricingExposure: z.number(),
    weightedScore: z.number(),
    revenueRiskSignal: z.number(),
    competitiveThreatSignal: z.number(),
  }),
  messagingOverlap: z.object({
    items: z.array(
      z.object({
        competitor: z.string(),
        you: z.number(),
        competitors: z.number(),
        risk: z.enum(["low", "medium", "high"]),
      }),
    ),
    insight: z.string(),
    ctaLabel: z.string(),
  }),
  objectionCoverage: z.object({
    score: z.number().min(0).max(100),
    identified: z.array(
      z.object({
        objection: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        evidence: z.string().optional(),
        impact: z.string().optional(),
      }),
    ),
    missing: z.array(
      z.object({
        objection: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        evidence: z.string().optional(),
        impact: z.string().optional(),
      }),
    ),
    risks: z.array(z.string()),
    guidance: z.array(
      z.object({
        objection: z.string(),
        recommendedStrategy: z.string(),
      }),
    ),
    dimensionScores: z.record(z.number()).optional(),
  }),
  differentiationInsights: z.object({
      similarityScore: z.number().min(0).max(100),
      overlapAreas: z.array(z.string()),
      opportunities: z.array(
        z.object({
          theme: z.string(),
          rationale: z.string(),
          implementationDifficulty: z.enum(["low", "medium", "high"]),
          expectedImpact: z.enum(["low", "medium", "high"]),
        }),
      ),
      strategyRecommendations: z.array(z.string()),
      parityRisks: z.array(z.string()),
      strategicNarrativeDifferences: z
        .array(
          z.object({
            difference: z.string(),
            evidence: z.array(
              z.object({
                competitor: z.string().trim().min(1),
                snippet: z.string().trim().min(20),
              }),
            ),
            confidence: z.number().min(0).max(1),
            actionPriority: z.enum(["P0", "P1", "P2"]),
          }),
        ),
      underservedPositioningTerritories: z
        .array(
          z.object({
            territory: z.string(),
            rationale: z.string(),
            evidence: z.array(
              z.object({
                competitor: z.string().trim().min(1),
                snippet: z.string().trim().min(20),
              }),
            ),
            confidence: z.number().min(0).max(1),
            actionPriority: z.enum(["P0", "P1", "P2"]),
          }),
        ),
      credibleDifferentiationAxes: z
        .array(
          z.object({
            axis: z.string(),
            rationale: z.string(),
            evidence: z.array(
              z.object({
                competitor: z.string().trim().min(1),
                snippet: z.string().trim().min(20),
              }),
            ),
            confidence: z.number().min(0).max(1),
            actionPriority: z.enum(["P0", "P1", "P2"]),
          }),
        ),
      marketPerceptionRisks: z
        .array(
          z.object({
            risk: z.string(),
            whyItMatters: z.string(),
            evidence: z.array(
              z.object({
                competitor: z.string().trim().min(1),
                snippet: z.string().trim().min(20),
              }),
            ),
            confidence: z.number().min(0).max(1),
            actionPriority: z.enum(["P0", "P1", "P2"]),
          }),
        ),
      recommendedPositioningDirection: z
        .object({
          direction: z.string(),
          rationale: z.string(),
          supportingEvidence: z.array(
            z.object({
              competitor: z.string().trim().min(1),
              snippet: z.string().trim().min(20),
            }),
          ),
          confidence: z.number().min(0).max(1),
          actionPriority: z.enum(["P0", "P1", "P2"]),
        }),
    }),
  competitiveInsights: z.array(
    z.object({
      claim: z.string().trim().min(1),
      evidence: z.array(
        z.object({
          competitor: z.string().trim().min(1),
          snippet: z.string().trim().min(20),
        }),
      ),
      reasoning: z.string().trim().min(20),
      confidence: z.number().min(0).max(1),
      actionPriority: z.enum(["P0", "P1", "P2"]),
    }),
  ),
  competitiveMatrix: z
    .object({
      profileMatrix: z.array(
        z.object({
          competitor: z.string(),
          ourAdvantage: z.string(),
          theirAdvantage: z.string(),
        }),
      ),
      competitorRows: z.array(
        z.object({
          competitor: z.string(),
          summary: z.string(),
          strengths: z.array(z.string()),
          weaknesses: z.array(z.string()),
          positioning: z.array(z.string()),
        }),
      ),
      differentiators: z.array(
        z.object({
          claim: z.string(),
          proof: z.string(),
        }),
      ),
      counters: z.array(
        z.object({
          competitor: z.string(),
          counter: z.string(),
        }),
      ),
      coreDifferentiationTension: z.string().optional(),
      substitutionRiskNarrative: z.string().optional(),
      counterPositioningVector: z.string().optional(),
      pricingDefenseNarrative: z.string().optional(),
    })
    .passthrough(),
  positioningMap: z.record(z.unknown()),
  rewrites: z.record(z.unknown()),
  rewriteRecommendations: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      category: z.string(),
      metric: z.string(),
      copy: z.string(),
      iconName: z
        .enum(["home", "pricing", "trust", "objection", "default"])
        .optional(),
    }),
  ),
  competitor_synthesis: z.object({
      coreDifferentiationTension: z.string(),
      messagingOverlapRisk: z.object({
        level: z.enum(["low", "moderate", "high"]),
        explanation: z.string(),
      }),
      substitutionRiskNarrative: z.string(),
      counterPositioningVector: z.string(),
      pricingDefenseNarrative: z.string(),
    }),
  executiveNarrative: z.string(),
  executiveSummary: z.string(),
  diagnosis: z.object({
    summary: z.string().trim().min(1),
    primaryGap: z.string().trim().min(1),
    primaryRisk: z.string().trim().min(1),
    primaryOpportunity: z.string().trim().min(1),
  }),
  threatLevel: z.enum(["low", "medium", "high"]),
  revenueImpact: z.object({
    pipelineAtRisk: z.number(),
    estimatedLiftPercent: z.number(),
    modeledWinRateDelta: z.number(),
    projectedPipelineRecovery: z.number(),
  }),
  revenueProjection: z.object({
    estimatedLiftPercent: z.number(),
    modeledWinRateDelta: z.number(),
    projectedPipelineRecovery: z.number(),
  }),
  priorityIssues: z.array(
    z.object({
      issue: z.string(),
      impactScore: z.number(),
      effortEstimate: z.number(),
      priorityScore: z.number(),
      tier: z.enum(["Critical", "High", "Medium"]),
    }),
  ),
  priorityIndex: z.array(
    z.object({
      issue: z.string(),
      impactScore: z.number(),
      effortEstimate: z.number(),
      priorityScore: z.number(),
      tier: z.enum(["Critical", "High", "Medium"]),
    }),
  ),
  createdAt: z.string(),
  status: z.enum(["queued", "running", "completed", "failed"]),
});
