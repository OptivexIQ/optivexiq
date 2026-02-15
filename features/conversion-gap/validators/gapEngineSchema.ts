import { z } from "zod";

export const gapEngineSchema = z.object({
  homepageUrl: z.string().url(),
  pricingUrl: z.string().url().optional().nullable(),
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url().optional().nullable(),
    }),
  ),
});

export type GapEngineValues = z.infer<typeof gapEngineSchema>;

export const gapEngineRequestSchema = z.object({
  homepage_url: z.string().url(),
  pricing_url: z.string().url().optional().nullable(),
  competitor_urls: z.array(z.string().url()).optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
});

export type GapEngineRequestValues = z.infer<typeof gapEngineRequestSchema>;
