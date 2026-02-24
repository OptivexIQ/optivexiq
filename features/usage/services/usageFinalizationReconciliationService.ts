import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import { emitOperationalAlert } from "@/lib/ops/criticalAlertService";
import { finalizeGenerateUsage } from "@/features/usage/services/usageTracker";

type ReconciliationRow = {
  reservation_key: string;
  user_id: string;
  exact_tokens: number;
  exact_cost_cents: number;
  attempts: number;
  route: string;
};

const MAX_ATTEMPTS_BEFORE_ALERT = 3;

function computeNextRetryIso(attempts: number): string {
  const backoffSeconds = Math.min(3600, Math.max(30, 30 * 2 ** attempts));
  return new Date(Date.now() + backoffSeconds * 1000).toISOString();
}

export async function enqueueUsageFinalizationReconciliation(input: {
  reservationKey: string;
  userId: string;
  route: string;
  exactTokens: number;
  exactCostCents: number;
  errorMessage: string;
}): Promise<void> {
  const admin = createSupabaseAdminClient("worker");
  const payload = {
    reservation_key: input.reservationKey,
    user_id: input.userId,
    usage_kind: "generate",
    route: input.route,
    exact_tokens: Math.max(0, Math.floor(input.exactTokens)),
    exact_cost_cents: Math.max(0, Math.floor(input.exactCostCents)),
    attempts: 0,
    last_error: input.errorMessage,
    next_retry_at: new Date().toISOString(),
    resolved_at: null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("usage_finalization_reconciliation")
    .insert(payload);

  if (!error) {
    return;
  }

  if (error.code !== "23505") {
    logger.error("Failed to enqueue usage finalization reconciliation.", error, {
      reservation_key: input.reservationKey,
      user_id: input.userId,
      route: input.route,
    });
    return;
  }

  const { error: updateError } = await admin
    .from("usage_finalization_reconciliation")
    .update({
      user_id: input.userId,
      route: input.route,
      exact_tokens: payload.exact_tokens,
      exact_cost_cents: payload.exact_cost_cents,
      last_error: payload.last_error,
      next_retry_at: payload.next_retry_at,
      resolved_at: null,
      updated_at: payload.updated_at,
    })
    .eq("reservation_key", input.reservationKey);

  if (updateError) {
    logger.error("Failed to refresh usage reconciliation job.", updateError, {
      reservation_key: input.reservationKey,
      user_id: input.userId,
      route: input.route,
    });
  }
}

export async function markUsageFinalizationReconciled(
  reservationKey: string,
): Promise<void> {
  const admin = createSupabaseAdminClient("worker");
  await admin
    .from("usage_finalization_reconciliation")
    .update({
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("reservation_key", reservationKey)
    .is("resolved_at", null);
}

export async function reconcilePendingUsageFinalizations(limit = 50): Promise<{
  processed: number;
  resolved: number;
  failed: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("usage_finalization_reconciliation")
    .select(
      "reservation_key, user_id, exact_tokens, exact_cost_cents, attempts, route",
    )
    .is("resolved_at", null)
    .lte("next_retry_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    logger.error("Failed to load pending usage reconciliation jobs.", error);
    return { processed: 0, resolved: 0, failed: 0 };
  }

  const jobs = (data ?? []) as ReconciliationRow[];
  let resolved = 0;
  let failed = 0;

  for (const job of jobs) {
    const exact = await finalizeGenerateUsage({
      userId: job.user_id,
      reservationKey: job.reservation_key,
      actualTokens: job.exact_tokens,
      actualCostCents: job.exact_cost_cents,
    });

    if (exact.ok) {
      resolved += 1;
      await markUsageFinalizationReconciled(job.reservation_key);
      continue;
    }

    failed += 1;
    const nextAttempts = job.attempts + 1;
    const nextRetryAt = computeNextRetryIso(nextAttempts);
    const errorMessage = exact.error ?? "usage_finalization_retry_failed";
    await admin
      .from("usage_finalization_reconciliation")
      .update({
        attempts: nextAttempts,
        last_error: errorMessage,
        next_retry_at: nextRetryAt,
        updated_at: new Date().toISOString(),
      })
      .eq("reservation_key", job.reservation_key);

    if (nextAttempts >= MAX_ATTEMPTS_BEFORE_ALERT) {
      await emitOperationalAlert({
        severity: "critical",
        source: "usage_finalization_reconciliation",
        message: "Usage finalization retry exhaustion.",
        context: {
          reservation_key: job.reservation_key,
          user_id: job.user_id,
          route: job.route,
          attempts: nextAttempts,
          last_error: errorMessage,
        },
      });
    }
  }

  return { processed: jobs.length, resolved, failed };
}


