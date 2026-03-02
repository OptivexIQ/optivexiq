import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

type RewriteTelemetryEventType =
  | "rewrite_started"
  | "rewrite_completed"
  | "rewrite_failed"
  | "rewrite_marked_winner"
  | "rewrite_exported";

type RewriteTelemetryEvent = {
  userId: string;
  requestId: string;
  eventType: RewriteTelemetryEventType;
  requestRef?: string | null;
  experimentGroupId?: string | null;
  route?: string | null;
  latencyMs?: number | null;
  reservedTokens?: number | null;
  actualTokens?: number | null;
  metadata?: Record<string, unknown>;
};

export async function emitRewriteTelemetryEvent(
  event: RewriteTelemetryEvent,
): Promise<void> {
  const admin = createSupabaseAdminClient("worker");
  const reservedTokens =
    typeof event.reservedTokens === "number"
      ? Math.max(0, Math.floor(event.reservedTokens))
      : null;
  const actualTokens =
    typeof event.actualTokens === "number"
      ? Math.max(0, Math.floor(event.actualTokens))
      : null;
  const latencyMs =
    typeof event.latencyMs === "number"
      ? Math.max(0, Math.floor(event.latencyMs))
      : null;
  const tokenDrift =
    reservedTokens === null || actualTokens === null
      ? null
      : actualTokens - reservedTokens;

  const { error } = await admin.from("rewrite_telemetry_events").insert({
    user_id: event.userId,
    request_id: event.requestId,
    request_ref: event.requestRef ?? null,
    experiment_group_id: event.experimentGroupId ?? null,
    event_type: event.eventType,
    route: event.route ?? null,
    latency_ms: latencyMs,
    reserved_tokens: reservedTokens,
    actual_tokens: actualTokens,
    token_drift: tokenDrift,
    metadata: event.metadata ?? {},
  });

  if (error) {
    logger.warn("rewrite_telemetry_insert_failed", {
      user_id: event.userId,
      request_id: event.requestId,
      request_ref: event.requestRef ?? null,
      experiment_group_id: event.experimentGroupId ?? null,
      event_type: event.eventType,
      route: event.route ?? null,
      error: error.message,
    });
  }
}

export async function getRewriteHealthSnapshot(params: {
  windowHours: number;
}): Promise<{
  started: number;
  completed: number;
  failed: number;
  recentFailureRate: number;
  avgLatencyMs: number;
  avgTokenDrift: number;
  experimentCreationRatePerHour: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const windowHours = Math.max(1, Math.floor(params.windowHours));
  const sinceIso = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { data: telemetryRows, error: telemetryError } = await admin
    .from("rewrite_telemetry_events")
    .select("event_type, latency_ms, token_drift")
    .gte("created_at", sinceIso);
  if (telemetryError || !telemetryRows) {
    throw new Error("rewrite_health_telemetry_query_failed");
  }

  const started = telemetryRows.filter(
    (row) => row.event_type === "rewrite_started",
  ).length;
  const completedRows = telemetryRows.filter(
    (row) => row.event_type === "rewrite_completed",
  );
  const failed = telemetryRows.filter(
    (row) => row.event_type === "rewrite_failed",
  ).length;

  const avgLatencyMs =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce(
            (sum, row) => sum + Math.max(0, Number(row.latency_ms ?? 0)),
            0,
          ) / completedRows.length,
        )
      : 0;

  const driftRows = completedRows.filter(
    (row) => typeof row.token_drift === "number",
  );
  const avgTokenDrift =
    driftRows.length > 0
      ? Math.round(
          driftRows.reduce((sum, row) => sum + Number(row.token_drift ?? 0), 0) /
            driftRows.length,
        )
      : 0;

  const denominator = started > 0 ? started : 1;
  const recentFailureRate = Number((failed / denominator).toFixed(4));

  const { count: experimentCreations, error: experimentsError } = await admin
    .from("rewrite_generations")
    .select("id", { count: "exact", head: true })
    .eq("version_number", 1)
    .gte("created_at", sinceIso);
  if (experimentsError) {
    throw new Error("rewrite_health_experiments_query_failed");
  }

  const experimentCreationRatePerHour = Number(
    (((experimentCreations ?? 0) / windowHours) || 0).toFixed(4),
  );

  return {
    started,
    completed: completedRows.length,
    failed,
    recentFailureRate,
    avgLatencyMs,
    avgTokenDrift,
    experimentCreationRatePerHour,
  };
}
