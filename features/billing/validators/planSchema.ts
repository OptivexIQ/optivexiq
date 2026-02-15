import { z } from "zod";

export const planSchema = z.enum(["starter", "pro", "growth"]);

export type BillingPlanInput = z.infer<typeof planSchema>;
