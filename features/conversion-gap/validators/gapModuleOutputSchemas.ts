import { z } from "zod";

export const gapAnalysisOutputSchema = z.object({
  gaps: z.array(z.string()),
  opportunities: z.array(z.string()),
  risks: z.array(z.string()),
  messagingOverlap: z.array(z.string()),
  missingObjections: z.array(z.string()),
  differentiationGaps: z.array(z.string()),
  pricingClarityIssues: z.array(z.string()),
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

