import { z } from "zod";

export const freeAuditRequestSchema = z.object({
  homepage_url: z.string().url(),
  pricing_url: z.string().url().optional().nullable(),
  competitor_urls: z.array(z.string().url()).optional().nullable(),
});

export type FreeAuditRequestValues = z.infer<typeof freeAuditRequestSchema>;
