import { z } from "zod";

export const gapAnalysisOutputSchema = z.object({
  gaps: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  messagingOverlap: z.array(z.string()),
  missingObjections: z.array(z.string()),
  differentiationGaps: z.array(z.string()),
  pricingClarityIssues: z.array(z.string()),
  positioningDiagnostics: z.object({
    icp_clarity_score: z.number().min(0).max(1),
    outcome_vs_feature_ratio: z.number().min(0),
    ambiguity_flags: z.array(z.string().trim().min(1)),
    ambiguity_flag_evidence: z.array(
      z.object({
        flag: z.string().trim().min(1),
        evidence: z.string().trim().min(10),
      }),
    ),
    value_prop_specificity_score: z.number().min(0).max(1),
    detected_icp_statements: z.array(z.string().trim().min(1)),
    missing_icp_dimensions: z.array(z.string().trim().min(1)),
  }),
}).superRefine((value, ctx) => {
  const missingEvidenceFlags = value.positioningDiagnostics.ambiguity_flags.filter(
    (flag) =>
      !value.positioningDiagnostics.ambiguity_flag_evidence.some(
        (evidence) => evidence.flag.trim().toLowerCase() === flag.trim().toLowerCase(),
      ),
  );
  if (missingEvidenceFlags.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `missing ambiguity evidence for flags: ${missingEvidenceFlags.join(", ")}`,
      path: ["positioningDiagnostics", "ambiguity_flag_evidence"],
    });
  }
});

export const heroOutputSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string().optional(),
});

export const pricingOutputSchema = z.object({
  valueMetric: z.string(),
  anchor: z.string(),
  packagingNotes: z.array(z.string()),
});

export const objectionOutputSchema = z.object({
  objections: z.array(
    z.object({
      objection: z.string(),
      response: z.string(),
    }),
  ),
});

export const differentiationOutputSchema = z.object({
  differentiators: z.array(
    z.object({
      claim: z.string(),
      proof: z.string(),
    }),
  ),
});

export const competitiveCounterOutputSchema = z.object({
  counters: z.array(
    z.object({
      competitor: z.string(),
      counter: z.string(),
    }),
  ),
});
