import { z } from "zod";

export const feedbackSubmissionSchema = z
  .object({
    requestType: z.enum(["feature", "bug"]),
    title: z.string().trim().min(6).max(180),
    summary: z.string().trim().min(30).max(5000),
    productArea: z.enum([
      "dashboard",
      "gap_engine",
      "reports",
      "billing",
      "free_audit",
      "marketing_site",
      "api",
      "other",
    ]),
    impact: z.enum(["low", "medium", "high", "critical"]),
    pageUrl: z.union([z.string().trim().url(), z.literal("")]).optional().default(""),
    reproductionSteps: z.string().trim().max(4000).optional().default(""),
    expectedBehavior: z.string().trim().max(2000).optional().default(""),
    actualBehavior: z.string().trim().max(2000).optional().default(""),
    name: z.string().trim().max(120).optional().default(""),
    email: z.string().trim().email().max(254),
    company: z.string().trim().max(160).optional().default(""),
    honeypot: z.string().optional().default(""),
  })
  .superRefine((value, ctx) => {
    if (value.requestType !== "bug") {
      return;
    }

    if ((value.reproductionSteps || "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bug reports require reproduction steps.",
        path: ["reproductionSteps"],
      });
    }

    if ((value.expectedBehavior || "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bug reports require expected behavior details.",
        path: ["expectedBehavior"],
      });
    }

    if ((value.actualBehavior || "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bug reports require actual behavior details.",
        path: ["actualBehavior"],
      });
    }
  });

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
