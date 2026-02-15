import { logger } from "@/lib/logger";
import { fetchSingleBy, upsertRow } from "@/lib/db/dbHelpers";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import type { UsageRecord, UsageMutationResult } from "./../types/usage.types";

type InitializeResult = UsageRecord | null;

// Security invariant:
// This service uses service-role RPC calls intentionally because Tier 0/Tier 1
// quota reservation and finalization functions are restricted to service_role.
// Route-level auth/plan guards must run before reaching this layer.

function toPositiveInt(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function nowIso() {
  return new Date().toISOString();
}

export async function getUsage(userId: string): Promise<UsageRecord | null> {
  const result = await fetchSingleBy<UsageRecord>(
    "usage_tracking",
    "user_id",
    userId,
  );

  return result.data ?? null;
}

export async function initializeUsageIfMissing(
  userId: string,
  billingPeriodEnd: string,
): Promise<InitializeResult> {
  const existing = await getUsage(userId);
  if (existing) {
    return existing;
  }

  const now = nowIso();
  const record: UsageRecord = {
    user_id: userId,
    billing_period_start: now,
    billing_period_end: billingPeriodEnd,
    tokens_used: 0,
    competitor_gaps_used: 0,
    rewrites_used: 0,
    ai_cost_cents: 0,
    updated_at: now,
  };

  const result = await upsertRow("usage_tracking", record, "user_id");
  if (!result.ok) {
    logger.error("Failed to initialize usage record.", {
      user_id: userId,
      error: result.error,
    });
    return null;
  }

  return result.data ?? null;
}

export async function incrementTokens(
  userId: string,
  tokens: number,
  costCents: number,
): Promise<UsageMutationResult> {
  const tokensToAdd = toPositiveInt(tokens);
  const costToAdd = toPositiveInt(costCents);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("record_generate_usage", {
    p_user_id: userId,
    p_tokens: tokensToAdd,
    p_cost_cents: costToAdd,
  });

  if (error) {
    logger.error("Usage token increment failed.", error, { user_id: userId });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function incrementGapReports(
  userId: string,
  reportId?: string,
): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = reportId
    ? await supabase.rpc("record_gap_report_usage", {
        p_user_id: userId,
        p_report_id: reportId,
        p_tokens: 0,
        p_cost_cents: 0,
      })
    : await supabase.rpc("increment_competitor_gaps", {
        p_user_id: userId,
      });

  if (error) {
    logger.error("Gap report increment failed.", error, { user_id: userId });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function reserveGenerateUsage(params: {
  userId: string;
  reservationKey: string;
  reservedTokens: number;
  reservedCostCents: number;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("reserve_generate_usage", {
    p_user_id: params.userId,
    p_reservation_key: params.reservationKey,
    p_reserved_tokens: toPositiveInt(params.reservedTokens),
    p_reserved_cost_cents: toPositiveInt(params.reservedCostCents),
  });

  if (error) {
    logger.error("Generate usage reservation failed.", error, {
      user_id: params.userId,
      reservation_key: params.reservationKey,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function finalizeGenerateUsage(params: {
  userId: string;
  reservationKey: string;
  actualTokens: number;
  actualCostCents: number;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("finalize_generate_usage", {
    p_user_id: params.userId,
    p_reservation_key: params.reservationKey,
    p_actual_tokens: toPositiveInt(params.actualTokens),
    p_actual_cost_cents: toPositiveInt(params.actualCostCents),
  });

  if (error) {
    logger.error("Generate usage finalization failed.", error, {
      user_id: params.userId,
      reservation_key: params.reservationKey,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function rollbackGenerateUsage(params: {
  userId: string;
  reservationKey: string;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("rollback_generate_usage", {
    p_user_id: params.userId,
    p_reservation_key: params.reservationKey,
  });

  if (error) {
    logger.error("Generate usage rollback failed.", error, {
      user_id: params.userId,
      reservation_key: params.reservationKey,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function recordGapReportUsage(
  userId: string,
  reportId: string,
  tokens: number,
  costCents: number,
): Promise<UsageMutationResult> {
  const tokensToAdd = toPositiveInt(tokens);
  const costToAdd = toPositiveInt(costCents);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("record_gap_report_usage", {
    p_user_id: userId,
    p_report_id: reportId,
    p_tokens: tokensToAdd,
    p_cost_cents: costToAdd,
  });

  if (error) {
    logger.error("Gap report usage recording failed.", error, {
      user_id: userId,
      report_id: reportId,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function completeGapReportAndCharge(params: {
  userId: string;
  reportId: string;
  reservationKey?: string;
  reportData: Record<string, unknown>;
  competitorData?: Record<string, unknown> | null;
  gapAnalysis?: Record<string, unknown> | null;
  rewrites?: Record<string, unknown> | null;
  tokens: number;
  costCents: number;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = params.reservationKey
    ? await supabase.rpc("complete_gap_report_with_reserved_usage", {
        p_user_id: params.userId,
        p_report_id: params.reportId,
        p_reservation_key: params.reservationKey,
        p_report_data: params.reportData,
        p_competitor_data: params.competitorData ?? null,
        p_gap_analysis: params.gapAnalysis ?? null,
        p_rewrites: params.rewrites ?? null,
        p_tokens: toPositiveInt(params.tokens),
        p_cost_cents: toPositiveInt(params.costCents),
      })
    : await supabase.rpc("complete_gap_report_with_usage", {
        p_user_id: params.userId,
        p_report_id: params.reportId,
        p_competitor_data: params.competitorData ?? null,
        p_gap_analysis: params.gapAnalysis ?? null,
        p_rewrites: params.rewrites ?? null,
        p_tokens: toPositiveInt(params.tokens),
        p_cost_cents: toPositiveInt(params.costCents),
      });

  if (error) {
    logger.error("Atomic gap report completion failed.", error, {
      user_id: params.userId,
      report_id: params.reportId,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function reserveGapReportQuota(params: {
  userId: string;
  reportId: string;
  reservationKey: string;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("reserve_gap_report_quota", {
    p_user_id: params.userId,
    p_report_id: params.reportId,
    p_reservation_key: params.reservationKey,
  });

  if (error) {
    logger.error("Gap report quota reservation failed.", error, {
      user_id: params.userId,
      report_id: params.reportId,
      reservation_key: params.reservationKey,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function rollbackGapReportQuotaReservation(params: {
  userId: string;
  reservationKey: string;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "rollback_gap_report_quota_reservation",
    {
      p_user_id: params.userId,
      p_reservation_key: params.reservationKey,
    },
  );

  if (error) {
    logger.error("Gap report quota rollback failed.", error, {
      user_id: params.userId,
      reservation_key: params.reservationKey,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function completeSnapshotReportAndCharge(params: {
  userId: string;
  reportId: string;
  snapshotResult: Record<string, unknown>;
  tokens: number;
  costCents: number;
}): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "complete_snapshot_report_with_usage",
    {
      p_user_id: params.userId,
      p_report_id: params.reportId,
      p_snapshot_result: params.snapshotResult,
      p_tokens: toPositiveInt(params.tokens),
      p_cost_cents: toPositiveInt(params.costCents),
    },
  );

  if (error) {
    logger.error("Atomic snapshot completion failed.", error, {
      user_id: params.userId,
      report_id: params.reportId,
    });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function incrementRewrites(
  userId: string,
): Promise<UsageMutationResult> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("increment_rewrites", {
    p_user_id: userId,
  });

  if (error) {
    logger.error("Rewrite increment failed.", error, { user_id: userId });
    return { ok: false, error: error.message };
  }

  const record = Array.isArray(data) ? data[0] : data;
  if (!record) {
    return { ok: false, error: "Usage record missing" };
  }

  return { ok: true, record: record as UsageRecord };
}

export async function resetUsage(
  userId: string,
  newBillingPeriodStart: string,
  newBillingPeriodEnd: string,
): Promise<UsageMutationResult> {
  const result = await upsertRow(
    "usage_tracking",
    {
      user_id: userId,
      billing_period_start: newBillingPeriodStart,
      billing_period_end: newBillingPeriodEnd,
      tokens_used: 0,
      competitor_gaps_used: 0,
      rewrites_used: 0,
      ai_cost_cents: 0,
      updated_at: nowIso(),
    },
    "user_id",
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, record: result.data ?? null };
}
