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
