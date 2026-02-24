import { z } from "zod";

export const planSchema = z.enum(["starter", "pro"]);

export type BillingPlanInput = z.infer<typeof planSchema>;
