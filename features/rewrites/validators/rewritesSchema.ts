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
  })
  .refine((value) => Boolean(value.websiteUrl || value.content), {
    path: ["websiteUrl"],
    message: "Provide a website URL or pasted content.",
  });

export type RewriteGenerateRequestValues = z.infer<
  typeof rewriteGenerateRequestSchema
>;
