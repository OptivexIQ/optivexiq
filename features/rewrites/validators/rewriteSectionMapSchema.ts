import { z } from "zod";
import { rewriteTypeSchema } from "@/features/rewrites/validators/rewritesSchema";

export const rewriteSectionMapRequestSchema = z.object({
  rewriteType: rewriteTypeSchema,
  requestRef: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, "Source content is required.")
    .max(20000, "Source content is too long."),
});

export const rewriteSectionMapResponseSchema = z.object({
  source: z.enum(["deterministic", "ai"]),
  sections: z.array(
    z.object({
      key: z.enum([
        "hero",
        "final_cta",
        "problem_solution",
        "features",
        "how_it_works",
        "product_showcase",
        "benefits_results",
        "testimonials_case_studies",
        "use_cases",
        "integrations",
        "pricing",
        "social_proof",
        "faq",
        "other",
      ]),
      label: z.string().min(1).max(64),
      content: z.string().min(1).max(10000),
      confidence: z.number().min(0).max(1),
    }),
  ),
  warnings: z.array(z.string().min(1).max(256)).default([]),
  model: z.string().nullable(),
});

export type RewriteSectionMapRequest = z.infer<
  typeof rewriteSectionMapRequestSchema
>;
export type RewriteSectionMapResponse = z.infer<
  typeof rewriteSectionMapResponseSchema
>;
