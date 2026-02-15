import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

type ConsumeRateLimitRow = {
  allowed: boolean;
  current_count: number;
  window_started_at: string;
};

type VerifyRateLimitRow = {
  is_ready: boolean;
  matching_count: number;
};

type RateLimitContext = {
  route: string;
  userId: string | null;
};

let startupCheckPromise: Promise<boolean> | null = null;

async function verifyRateLimitFunctionSignature(): Promise<boolean> {
  const supabase = createSupabaseAdminClient("worker");
  const { data, error } = await supabase.rpc("verify_rate_limit_function_ready");

  if (error) {
    logger.error("FATAL: rate limit function startup check failed.", error, {
      component: "rate_limit_startup",
      error_type: error.code ?? "rpc_error",
    });
    return false;
  }

  const row = (Array.isArray(data) ? data[0] : data) as VerifyRateLimitRow | null;
  if (!row) {
    logger.error(
      "FATAL: rate limit function startup check returned no data.",
      undefined,
      {
        component: "rate_limit_startup",
        error_type: "no_data",
      },
    );
    return false;
  }

  if (!row.is_ready) {
    logger.error("FATAL: rate limit function signature mismatch.", undefined, {
      component: "rate_limit_startup",
      error_type: "signature_mismatch",
      matching_count: row.matching_count,
    });
    return false;
  }

  return true;
}

export async function runRateLimitStartupCheck(): Promise<boolean> {
  if (!startupCheckPromise) {
    startupCheckPromise = verifyRateLimitFunctionSignature();
  }

  return startupCheckPromise;
}

export async function consumeRateLimit(
  ip: string,
  context: RateLimitContext,
): Promise<boolean> {
  const startupReady = await runRateLimitStartupCheck();
  if (!startupReady) {
    logger.error("Rate limit consume blocked by startup verification failure.", undefined, {
      route: context.route,
      user_id: context.userId,
      error_type: "startup_verification_failed",
      rate_key: `ip:${ip || "unknown"}`,
    });
    return false;
  }

  const supabase = createSupabaseAdminClient("worker");
  const rateKey = `ip:${ip || "unknown"}`;
  const { data, error } = await supabase.rpc("consume_request_rate_limit", {
    p_rate_key: rateKey,
    p_window_seconds: WINDOW_SECONDS,
    p_max_requests: MAX_REQUESTS,
  });

  if (error) {
    logger.error("Rate limit consume failed.", error, {
      route: context.route,
      user_id: context.userId,
      error_type: error.code ?? "rpc_error",
      rate_key: rateKey,
    });
    return false;
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as ConsumeRateLimitRow | null;
  if (!row) {
    logger.error("Rate limit consume returned no data.", undefined, {
      route: context.route,
      user_id: context.userId,
      error_type: "no_data",
      rate_key: rateKey,
    });
    return false;
  }

  return row.allowed;
}

