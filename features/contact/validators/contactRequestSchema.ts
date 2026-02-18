import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  topic: z.enum(["support", "sales", "legal", "security", "billing", "other"]),
  company: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(20).max(4000),
  honeypot: z.string().optional().default(""),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
