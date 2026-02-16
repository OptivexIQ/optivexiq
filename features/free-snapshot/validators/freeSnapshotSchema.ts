import { z } from "zod";

export const freeConversionSnapshotSchema = z.object({
  executiveSummary: z.string().min(1),
  topMessagingGap: z.string().min(1),
  topObjectionGap: z.string().min(1),
  clarityScore: z.number().min(0).max(100),
  positioningScore: z.number().min(0).max(100),
  riskEstimate: z.string().min(1),
  quickWins: z.array(z.string().min(1)).min(1).max(5),
});

export const freeSnapshotCreateRequestSchema = z.object({
  websiteUrl: z.string().url(),
  competitorUrls: z.array(z.string().url()).max(2).optional().default([]),
  email: z.string().email().optional(),
  context: z.string().trim().max(500).optional(),
  honeypot: z.string().optional(),
  captchaToken: z.string().optional(),
});

export const freeSnapshotUnlockRequestSchema = z.object({
  snapshotId: z.string().uuid(),
  email: z.string().email(),
  consent: z.boolean().optional().default(false),
  honeypot: z.string().optional(),
  captchaToken: z.string().optional(),
});

const executionStageSchema = z.enum([
  "fetching_homepage_content",
  "extracting_positioning_signals",
  "analyzing_competitor_structure",
  "generating_executive_diagnosis",
  "scoring_conversion_gaps",
  "finalizing_snapshot",
]);

export const freeSnapshotStatusResponseSchema = z.object({
  snapshotId: z.string().uuid(),
  status: z.enum([
    "queued",
    "scraping",
    "analyzing",
    "generating",
    "completed",
    "failed",
  ]),
  executionStage: executionStageSchema.nullable(),
  snapshot: freeConversionSnapshotSchema.nullable(),
  error: z.string().nullable(),
  websiteUrl: z.string().url(),
  competitorCount: z.number().int().min(0).max(2),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FreeSnapshotCreateRequest = z.infer<
  typeof freeSnapshotCreateRequestSchema
>;
export type FreeSnapshotUnlockRequest = z.infer<
  typeof freeSnapshotUnlockRequestSchema
>;
