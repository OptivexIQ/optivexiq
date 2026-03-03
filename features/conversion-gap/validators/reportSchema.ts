import { z } from "zod";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";

const evidenceBoundConclusionSchema = z.object({
  claim: z.string().trim().min(1),
  evidence: z.array(z.string().trim().min(1)).min(1),
  derivedFrom: z.array(z.string().trim().min(1)).min(1),
  confidenceScore: z.number().min(0).max(100),
});

const evidenceProvenanceSectionSchema = z.object({
  evidence_sources: z.array(
    z.object({
      url: z.string().url(),
      snippet_hash: z.string().regex(/^[a-f0-9]{64}$/i),
    }),
  ),
  evidence_hash: z.string().regex(/^[a-f0-9]{64}$/i),
  module_prompt_version: z.number().int().min(1),
  model_name: z.string().trim().min(1),
  model_temperature: z.number().min(0).max(2),
  token_count: z.number().int().min(0),
});

const baseConversionGapReportSchema = z.object({
  reportSchemaVersion: z.number().int().min(1).optional(),
  legacyMigrated: z.boolean().optional(),
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
  riskModelVersion: z.string().min(1),
  taxonomyVersion: z.string().min(1),
  scoringWeightsVersion: z.string().min(1),
  positioningMapGenerationVersion: z.string().min(1).optional(),
  reproducibilityChecksum: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  sectionHashes: z.record(z.string().regex(/^[a-f0-9]{64}$/i)).optional(),
  evidenceProvenance: z
    .record(evidenceProvenanceSectionSchema)
    .optional(),
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
        dimensionalOverlap: z
          .object({
            messaging_overlap: z.number().min(0).max(100),
            positioning_overlap: z.number().min(0).max(100),
            pricing_overlap: z.number().min(0).max(100),
            aggregate_overlap: z.number().min(0).max(100),
            signal_density: z.number().min(0).max(100),
          })
          .optional(),
        overlapDistribution: z
          .object({
            low: z.number().min(0).max(100),
            moderate: z.number().min(0).max(100),
            high: z.number().min(0).max(100),
            dimensions: z.number().int().min(1),
          })
          .optional(),
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
    }),
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
  competitive_section: z.object({
    status: z.enum(["ready", "insufficient_signal"]),
    reason_code: z
      .enum([
        "insufficient_competitor_coverage",
        "insufficient_overlap_density",
        "insufficient_extraction_confidence",
      ])
      .nullable(),
    evidence: z.array(z.string().trim().min(1)),
    evidence_count: z.number().int().min(0),
    signal_density_score: z.number().min(0).max(100),
    extraction_confidence: z.number().min(0).max(100),
  }),
  competitor_synthesis: z.object({
      coreDifferentiationTension: z.string(),
      messagingOverlapRisk: z.object({
        level: z.enum(["low", "moderate", "high"]),
        explanation: z.string(),
      }),
      substitutionRiskNarrative: z.string(),
      counterPositioningVector: z.string(),
      pricingDefenseNarrative: z.string(),
      taxonomyVersion: z.string().optional(),
      companyTaxonomy: z
        .object({
          competitor: z.string(),
          valuePropositions: z.array(z.string()),
          targetSegments: z.array(z.string()),
          primaryClaims: z.array(z.string()),
          differentiationSignals: z.array(z.string()),
          pricingSignals: z.array(z.string()),
        })
        .optional(),
      competitorTaxonomies: z
        .array(
          z.object({
            competitor: z.string(),
            valuePropositions: z.array(z.string()),
            targetSegments: z.array(z.string()),
            primaryClaims: z.array(z.string()),
            differentiationSignals: z.array(z.string()),
            pricingSignals: z.array(z.string()),
          }),
        )
        .optional(),
      overlapByCompetitor: z
        .array(
          z.object({
            competitor: z.string(),
            messaging_overlap: z.number().min(0).max(100),
            positioning_overlap: z.number().min(0).max(100),
            pricing_overlap: z.number().min(0).max(100),
            aggregate_overlap: z.number().min(0).max(100),
            signal_density: z.number().min(0).max(100),
          }),
        )
        .optional(),
      dimensionalOverlap: z
        .object({
          messaging_overlap: z.number().min(0).max(100),
          positioning_overlap: z.number().min(0).max(100),
          pricing_overlap: z.number().min(0).max(100),
          aggregate_overlap: z.number().min(0).max(100),
        })
        .optional(),
      whiteSpaceOpportunities: z
        .array(
          z.object({
            claim: z.string().trim().min(1),
            dimension: z.enum(["messaging", "positioning", "pricing"]),
            missingAcross: z.number().int().min(0),
            evidence: z.array(z.string().trim().min(1)).min(1),
            whitespaceConfidenceScore: z.number().min(0).max(100).optional(),
            supportingCompetitorIds: z.array(z.string().trim().min(1)).optional(),
            embeddingDistance: z.number().min(0).optional(),
            claimSpecificityScore: z.number().min(0).max(100).optional(),
          }),
        )
        .optional(),
      overlapDensity: z.number().min(0).max(100).optional(),
      referencedTaxonomyIds: z.array(z.string().trim().min(1)).optional(),
      referencedOverlapDimensionIds: z
        .array(
          z.enum([
            "messaging_overlap",
            "positioning_overlap",
            "pricing_overlap",
            "aggregate_overlap",
          ]),
        )
        .optional(),
      whiteSpaceRulesApplied: z.array(z.string().trim().min(1)).optional(),
    }),
  executiveNarrative: z.string(),
  executiveSummary: z.string(),
  diagnosis: z.object({
    summary: z.string().trim().min(1),
    primaryGap: z.string().trim().min(1),
    primaryRisk: z.string().trim().min(1),
    primaryOpportunity: z.string().trim().min(1),
  }),
  sectionConfidence: z.object({
    positioning: z.number().min(0).max(100),
    objections: z.number().min(0).max(100),
    differentiation: z.number().min(0).max(100),
    scoring: z.number().min(0).max(100),
    narrative: z.number().min(0).max(100),
  }),
  diagnosticEvidence: z.object({
    positioningClarity: z.array(evidenceBoundConclusionSchema).min(1),
    objectionCoverage: z.array(evidenceBoundConclusionSchema).min(1),
    competitiveOverlap: z.array(evidenceBoundConclusionSchema).min(1),
    riskPrioritization: z.array(evidenceBoundConclusionSchema).min(1),
    narrativeDiagnosis: z.array(evidenceBoundConclusionSchema).min(1),
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

export const conversionGapReportSchema = baseConversionGapReportSchema.superRefine(
  (report, ctx) => {
    if (report.status !== "completed") {
      return;
    }

    if (
      report.competitive_section.status === "insufficient_signal" &&
      report.competitive_section.evidence_count > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "insufficient competitive section must not include evidence_count > 0",
        path: ["competitive_section", "evidence_count"],
      });
    }

    if (
      report.competitive_section.status === "insufficient_signal" &&
      report.competitiveInsights.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "insufficient competitive section must not include competitiveInsights",
        path: ["competitiveInsights"],
      });
    }

    if (
      report.competitive_section.status === "insufficient_signal" &&
      report.competitor_synthesis.overlapByCompetitor &&
      report.competitor_synthesis.overlapByCompetitor.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "insufficient competitive section must not include overlapByCompetitor",
        path: ["competitor_synthesis", "overlapByCompetitor"],
      });
    }

    if (report.competitive_section.status === "insufficient_signal") {
      if (!report.competitive_section.reason_code) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "insufficient competitive section requires reason_code",
          path: ["competitive_section", "reason_code"],
        });
      }
      if (report.competitive_section.evidence.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "insufficient competitive section must not include evidence entries",
          path: ["competitive_section", "evidence"],
        });
      }
      return;
    }

    if (
      !report.reproducibilityChecksum ||
      !report.sectionHashes ||
      !report.evidenceProvenance
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require reproducibilityChecksum, sectionHashes, and evidenceProvenance",
        path: ["reproducibilityChecksum"],
      });
    }

  const synthesis = report.competitor_synthesis;
    if (!synthesis.companyTaxonomy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.companyTaxonomy",
        path: ["competitor_synthesis", "companyTaxonomy"],
      });
    }

    if (!synthesis.competitorTaxonomies || synthesis.competitorTaxonomies.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.competitorTaxonomies",
        path: ["competitor_synthesis", "competitorTaxonomies"],
      });
    }

    if (!synthesis.overlapByCompetitor || synthesis.overlapByCompetitor.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.overlapByCompetitor",
        path: ["competitor_synthesis", "overlapByCompetitor"],
      });
    }

    if (!synthesis.dimensionalOverlap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.dimensionalOverlap",
        path: ["competitor_synthesis", "dimensionalOverlap"],
      });
    }

    if (synthesis.taxonomyVersion !== report.taxonomyVersion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require matching taxonomyVersion and competitor_synthesis.taxonomyVersion",
        path: ["taxonomyVersion"],
      });
    }

    if (!synthesis.referencedTaxonomyIds || synthesis.referencedTaxonomyIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.referencedTaxonomyIds",
        path: ["competitor_synthesis", "referencedTaxonomyIds"],
      });
    }

    if (
      !synthesis.referencedOverlapDimensionIds ||
      synthesis.referencedOverlapDimensionIds.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "completed reports require competitor_synthesis.referencedOverlapDimensionIds",
        path: ["competitor_synthesis", "referencedOverlapDimensionIds"],
      });
    }

    if (report.messagingOverlap.items.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "completed reports require non-empty messagingOverlap.items",
        path: ["messagingOverlap", "items"],
      });
    }
  },
);
