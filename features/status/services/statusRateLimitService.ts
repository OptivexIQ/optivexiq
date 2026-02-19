import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

type ConsumeRateLimitRow = {
  allowed: boolean;
  current_count: number;
  window_started_at: string;
};

const STATUS_WINDOW_SECONDS = 60;
const STATUS_MAX_REQUESTS = 120;

export async function consumeStatusRateLimit(ipAddress: string | null) {
  const admin = createSupabaseAdminClient("worker");
  const rateKey = `public_status:${ipAddress || "unknown"}`;

  const { data, error } = await admin.rpc("consume_request_rate_limit", {
    p_rate_key: rateKey,
    p_window_seconds: STATUS_WINDOW_SECONDS,
    p_max_requests: STATUS_MAX_REQUESTS,
  });

  if (error) {
    logger.error("status.rate_limit_consume_failed", error, { rate_key: rateKey });
    return { allowed: false as const, reason: "rpc_error" as const };
  }

  const row = (Array.isArray(data) ? data[0] : data) as ConsumeRateLimitRow | null;
  if (!row) {
    logger.error("status.rate_limit_no_data", undefined, { rate_key: rateKey });
    return { allowed: false as const, reason: "no_data" as const };
  }

  return {
    allowed: row.allowed,
    reason: row.allowed ? null : ("limit_exceeded" as const),
  };
}
