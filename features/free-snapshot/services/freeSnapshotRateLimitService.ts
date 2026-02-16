import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

const FREE_SNAPSHOT_WINDOW_SECONDS = 3600;
const FREE_SNAPSHOT_MAX_REQUESTS = 5;

type ConsumeRateLimitRow = {
  allowed: boolean;
  current_count: number;
  window_started_at: string;
};

export async function consumeFreeSnapshotRateLimit(ipAddress: string | null) {
  const supabase = createSupabaseAdminClient("worker");
  const rateKey = `free_snapshot:${ipAddress || "unknown"}`;
  const { data, error } = await supabase.rpc("consume_request_rate_limit", {
    p_rate_key: rateKey,
    p_window_seconds: FREE_SNAPSHOT_WINDOW_SECONDS,
    p_max_requests: FREE_SNAPSHOT_MAX_REQUESTS,
  });

  if (error) {
    logger.error("Free snapshot rate limit consume failed.", error, {
      rate_key: rateKey,
    });
    return { allowed: false as const, reason: "rpc_error" as const };
  }

  const row = (
    Array.isArray(data) ? data[0] : data
  ) as ConsumeRateLimitRow | null;
  if (!row) {
    logger.error("Free snapshot rate limit returned no data.", undefined, {
      rate_key: rateKey,
    });
    return { allowed: false as const, reason: "no_data" as const };
  }

  return {
    allowed: row.allowed,
    reason: row.allowed ? null : ("limit_exceeded" as const),
  };
}
