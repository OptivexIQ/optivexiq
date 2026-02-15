import { z } from "zod";

export const conversionGapReportSchema = z.object({
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
  objectionCoverage: z.record(z.number()),
  competitiveMatrix: z.record(z.unknown()),
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
  competitor_synthesis: z
    .object({
      coreDifferentiationTension: z.string(),
      messagingOverlapRisk: z.object({
        level: z.enum(["low", "moderate", "high"]),
        explanation: z.string(),
      }),
      substitutionRiskNarrative: z.string(),
      counterPositioningVector: z.string(),
      pricingDefenseNarrative: z.string(),
    })
    .optional(),
  executiveNarrative: z.string(),
  executiveSummary: z.string(),
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

export const canonicalReportDataEnvelopeSchema = z.object({
  gap_analysis: z.record(z.unknown()),
  rewrites: z.record(z.unknown()),
  competitor_synthesis: conversionGapReportSchema.shape.competitor_synthesis
    .nullable()
    .optional(),
  scores: z.object({
    conversion_score: z.number(),
    funnel_risk: z.number(),
    win_rate_delta: z.number(),
    pipeline_at_risk: z.number(),
    differentiation_score: z.number(),
    pricing_score: z.number(),
    clarity_score: z.number(),
    confidence_score: z.number(),
    threat_level: z.enum(["low", "medium", "high"]),
  }),
  metadata: z.object({
    report_id: z.string(),
    company: z.string(),
    segment: z.string(),
    created_at: z.string(),
    status: z.enum(["queued", "running", "completed", "failed"]),
    executive_narrative: z.string(),
    executive_summary: z.string(),
    messaging_overlap: conversionGapReportSchema.shape.messagingOverlap,
    objection_coverage: z.record(z.number()),
    competitive_matrix: z.record(z.unknown()),
    positioning_map: z.record(z.unknown()),
    rewrite_recommendations: conversionGapReportSchema.shape.rewriteRecommendations,
    revenue_impact: conversionGapReportSchema.shape.revenueImpact,
    revenue_projection: conversionGapReportSchema.shape.revenueProjection,
    priority_issues: conversionGapReportSchema.shape.priorityIssues,
    priority_index: conversionGapReportSchema.shape.priorityIndex,
  }),
});
