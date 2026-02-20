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

export const rewriteGenerateRequestSchema = z
  .object({
    rewriteType: rewriteTypeSchema,
    websiteUrl: websiteUrlSchema,
    content: contentSchema,
    notes: notesSchema,
  })
  .refine((value) => Boolean(value.websiteUrl || value.content), {
    path: ["websiteUrl"],
    message: "Provide a website URL or pasted content.",
  });

export type RewriteGenerateRequestValues = z.infer<
  typeof rewriteGenerateRequestSchema
>;

