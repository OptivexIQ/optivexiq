import "server-only";
/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are present at runtime
 */

import { z } from "zod";
import { RuntimeServerConfig } from "@/lib/config/runtime.server";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required")
    .optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, "Resend API key is required").optional(),
  FROM_EMAIL: z.string().email("Invalid FROM_EMAIL").optional(),
  ADMIN_EMAIL: z.string().email("Invalid ADMIN_EMAIL").optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Application
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("Invalid NEXT_PUBLIC_SITE_URL")
    .optional(),

  // Optional: Cron
  CRON_SECRET: z.string().min(1).optional(),

  // Optional: LemonSqueezy
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1).optional(),
  LEMONSQUEEZY_STARTER_CHECKOUT_URL: z.string().url().optional(),
  LEMONSQUEEZY_PRO_CHECKOUT_URL: z.string().url().optional(),
  LEMONSQUEEZY_GROWTH_CHECKOUT_URL: z.string().url().optional(),
  LEMONSQUEEZY_PORTAL_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  try {
    return envSchema.parse(RuntimeServerConfig.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n");
      throw new Error(
        `❌ Invalid environment variables:\n${missingVars}\n\nPlease check your .env file or environment configuration.`,
      );
    }
    throw error;
  }
}

// Validate environment variables on module load
export const env = getEnv();

// Export individual variables for convenience with defaults
export const NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
export const RESEND_API_KEY = env.RESEND_API_KEY;
export const FROM_EMAIL = env.FROM_EMAIL || "hello@optivexiq.com";
export const ADMIN_EMAIL = env.ADMIN_EMAIL || "admin@optivexiq.com";
export const OPENAI_API_KEY = env.OPENAI_API_KEY;
export const NODE_ENV = env.NODE_ENV || "development";
export const NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL;
export const CRON_SECRET = env.CRON_SECRET;
export const LEMONSQUEEZY_API_KEY = env.LEMONSQUEEZY_API_KEY;
export const LEMONSQUEEZY_WEBHOOK_SECRET = env.LEMONSQUEEZY_WEBHOOK_SECRET;
export const LEMONSQUEEZY_STARTER_CHECKOUT_URL =
  env.LEMONSQUEEZY_STARTER_CHECKOUT_URL;
export const LEMONSQUEEZY_PRO_CHECKOUT_URL = env.LEMONSQUEEZY_PRO_CHECKOUT_URL;
export const LEMONSQUEEZY_GROWTH_CHECKOUT_URL =
  env.LEMONSQUEEZY_GROWTH_CHECKOUT_URL;
export const LEMONSQUEEZY_PORTAL_URL = env.LEMONSQUEEZY_PORTAL_URL;

// Helper to check if we're in production
export const isProduction = NODE_ENV === "production";
export const isDevelopment = NODE_ENV === "development";
export const isTest = NODE_ENV === "test";
