import { z } from "zod";

export const rewriteTypeSchema = z.enum(["homepage", "pricing"]);

const websiteUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const contentSchema = z
  .string()
  .trim()
  .max(12000, "Content is too long.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const notesSchema = z
  .string()
  .trim()
  .max(1000, "Notes are too long.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8, "Idempotency key is required.")
  .max(128, "Idempotency key is too long.");

const hypothesisTypeSchema = z.enum([
  "positioning_shift",
  "objection_attack",
  "differentiation_emphasis",
  "risk_reduction",
  "authority_increase",
  "clarity_simplification",
]);

const controlledVariableSchema = z.enum([
  "audience",
  "tone",
  "structure",
  "value_prop",
  "cta_type",
  "proof_points",
  "pricing_frame",
]);

const treatmentVariableSchema = z.enum([
  "headline",
  "primary_cta",
  "objection_handling",
  "differentiators",
  "risk_reversal",
  "proof_depth",
  "pricing_anchor",
]);

const minimumDeltaLevelSchema = z.enum(["light", "moderate", "strong"]);

export const rewriteGenerateRequestSchema = z
  .object({
    rewriteType: rewriteTypeSchema,
    idempotencyKey: idempotencyKeySchema,
    parentRequestRef: z
      .string()
      .trim()
      .min(3)
      .max(128)
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : undefined)),
    websiteUrl: websiteUrlSchema,
    content: contentSchema,
    notes: notesSchema,
    strategicContext: z
      .object({
        target: rewriteTypeSchema,
        goal: z.enum(["conversion", "clarity", "differentiation"]),
        icp: z.string().trim().max(120, "ICP is too long."),
        focus: z.object({
          differentiation: z.boolean(),
          objection: z.boolean(),
        }),
      })
      .optional(),
    rewriteStrategy: z
      .object({
        tone: z.enum([
          "neutral",
          "confident",
          "technical",
          "direct",
          "founder-led",
          "enterprise",
        ]),
        length: z.enum(["short", "standard", "long"]),
        emphasis: z
          .array(
            z.enum([
              "clarity",
              "differentiation",
              "objection-handling",
              "pricing-clarity",
              "proof-credibility",
            ]),
          )
          .max(5)
          .default([]),
        constraints: z.string().trim().max(500).optional(),
        audience: z.string().trim().max(120).optional(),
      })
      .optional(),
    hypothesis: z.object({
      type: hypothesisTypeSchema,
      controlledVariables: z
        .array(controlledVariableSchema)
        .min(2, "Select at least 2 controlled variables.")
        .max(7)
        .refine((values) => new Set(values).size === values.length, {
          message: "Controlled variables must be unique.",
        }),
      treatmentVariables: z
        .array(treatmentVariableSchema)
        .min(1, "Select at least 1 treatment variable.")
        .max(7)
        .refine((values) => new Set(values).size === values.length, {
          message: "Treatment variables must be unique.",
        }),
      successCriteria: z
        .string()
        .trim()
        .min(8, "Success criteria is required.")
        .max(280, "Success criteria is too long."),
      minimumDeltaLevel: minimumDeltaLevelSchema,
    }),
  })
  .refine((value) => Boolean(value.websiteUrl || value.content), {
    path: ["websiteUrl"],
    message: "Provide a website URL or pasted content.",
  });

export type RewriteGenerateRequestValues = z.infer<
  typeof rewriteGenerateRequestSchema
>;
