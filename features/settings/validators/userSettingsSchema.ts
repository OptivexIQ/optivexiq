import { z } from "zod";

export const userSettingsSchema = z.object({
  workspace_name: z.string().min(1).max(120).nullable().optional(),
  primary_contact: z.string().email().nullable().optional(),
  region: z.string().min(1).max(80).nullable().optional(),
  report_retention_days: z.number().int().min(1).max(3650).optional(),
  export_restricted: z.boolean().optional(),
  weekly_exec_summary: z.boolean().optional(),
  completion_alerts: z.boolean().optional(),
  overlap_warnings: z.boolean().optional(),
  security_review_completed: z.boolean().optional(),
  security_review_date: z.string().datetime().nullable().optional(),
});

export type UserSettingsPayload = z.infer<typeof userSettingsSchema>;
