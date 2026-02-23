import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

const FREE_SNAPSHOT_WINDOW_SECONDS = 3600;
const FREE_SNAPSHOT_MAX_REQUESTS = 5;
const FREE_SNAPSHOT_UNLOCK_WINDOW_SECONDS = 3600;
const FREE_SNAPSHOT_UNLOCK_MAX_REQUESTS = 8;
const FREE_SNAPSHOT_DOWNLOAD_WINDOW_SECONDS = 3600;
const FREE_SNAPSHOT_DOWNLOAD_MAX_REQUESTS = 8;

type ConsumeRateLimitRow = {
  allowed: boolean;
  current_count: number;
  window_started_at: string;
};

export async function consumeFreeSnapshotRateLimit(ipAddress: string | null) {
  const rateKey = `free_snapshot:create:${ipAddress || "unknown"}`;
  return consumeFreeSnapshotLimit(rateKey, {
    windowSeconds: FREE_SNAPSHOT_WINDOW_SECONDS,
    maxRequests: FREE_SNAPSHOT_MAX_REQUESTS,
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function consumeFreeSnapshotLimit(
  rateKey: string,
  input: {
    windowSeconds: number;
    maxRequests: number;
  },
) {
  const supabase = createSupabaseAdminClient("worker");
  const { data, error } = await supabase.rpc("consume_request_rate_limit", {
    p_rate_key: rateKey,
    p_window_seconds: input.windowSeconds,
    p_max_requests: input.maxRequests,
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

export async function consumeFreeSnapshotUnlockRateLimit(input: {
  ipAddress: string | null;
  email: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const [ipLimit, emailLimit] = await Promise.all([
    consumeFreeSnapshotLimit(`free_snapshot:unlock:ip:${input.ipAddress || "unknown"}`, {
      windowSeconds: FREE_SNAPSHOT_UNLOCK_WINDOW_SECONDS,
      maxRequests: FREE_SNAPSHOT_UNLOCK_MAX_REQUESTS,
    }),
    consumeFreeSnapshotLimit(`free_snapshot:unlock:email:${normalizedEmail}`, {
      windowSeconds: FREE_SNAPSHOT_UNLOCK_WINDOW_SECONDS,
      maxRequests: FREE_SNAPSHOT_UNLOCK_MAX_REQUESTS,
    }),
  ]);

  if (!ipLimit.allowed) {
    return { allowed: false as const, reason: ipLimit.reason };
  }
  if (!emailLimit.allowed) {
    return { allowed: false as const, reason: emailLimit.reason };
  }
  return { allowed: true as const, reason: null };
}

export async function consumeFreeSnapshotDownloadRateLimit(input: {
  ipAddress: string | null;
  email: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const [ipLimit, emailLimit] = await Promise.all([
    consumeFreeSnapshotLimit(
      `free_snapshot:download:ip:${input.ipAddress || "unknown"}`,
      {
        windowSeconds: FREE_SNAPSHOT_DOWNLOAD_WINDOW_SECONDS,
        maxRequests: FREE_SNAPSHOT_DOWNLOAD_MAX_REQUESTS,
      },
    ),
    consumeFreeSnapshotLimit(`free_snapshot:download:email:${normalizedEmail}`, {
      windowSeconds: FREE_SNAPSHOT_DOWNLOAD_WINDOW_SECONDS,
      maxRequests: FREE_SNAPSHOT_DOWNLOAD_MAX_REQUESTS,
    }),
  ]);

  if (!ipLimit.allowed) {
    return { allowed: false as const, reason: ipLimit.reason };
  }
  if (!emailLimit.allowed) {
    return { allowed: false as const, reason: emailLimit.reason };
  }
  return { allowed: true as const, reason: null };
}
