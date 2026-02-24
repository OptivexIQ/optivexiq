import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { emitOperationalAlert } from "@/lib/ops/criticalAlertService";

type QueueName = "report_jobs" | "free_snapshot_jobs";
type WorkerName = "report_worker" | "snapshot_worker";

type JobStatusRow = {
  status: string;
};

type QueueAgeRow = {
  created_at: string;
  locked_at: string | null;
  completed_at: string | null;
  status: string;
};

type WorkerHeartbeatRow = {
  worker_name: WorkerName;
  queue_name: QueueName;
  last_seen_at: string;
  last_failure_rate: number;
  last_claimed: number;
  last_completed: number;
  last_failed: number;
  last_requeued: number;
  last_poisoned: number;
  last_oldest_queued_age_seconds: number;
  last_average_processing_delay_seconds: number;
};

export type QueueHealthSnapshot = {
  generatedAt: string;
  queueSize: {
    report: number;
    snapshot: number;
    total: number;
  };
  oldestQueuedAgeSeconds: {
    report: number;
    snapshot: number;
    overall: number;
  };
  averageProcessingDelaySeconds: {
    report: number;
    snapshot: number;
    overall: number;
  };
  failureRate: {
    report: number;
    snapshot: number;
    overall: number;
  };
  workerFailureRate: {
    report: number;
    snapshot: number;
    overall: number;
  };
  dependencies: {
    supabase: boolean;
  };
  workerStatus: {
    report: {
      lastSeenAt: string | null;
      alive: boolean;
      lastClaimed: number;
      lastCompleted: number;
      lastFailed: number;
      lastRequeued: number;
      lastPoisoned: number;
    };
    snapshot: {
      lastSeenAt: string | null;
      alive: boolean;
      lastClaimed: number;
      lastCompleted: number;
      lastFailed: number;
      lastRequeued: number;
      lastPoisoned: number;
    };
  };
};

const WORKER_STALE_SECONDS = 180;
const ALERT_THRESHOLDS = {
  oldestQueuedAgeSeconds: 600,
  averageProcessingDelaySeconds: 300,
  errorRate: 0.35,
  workerFailureRate: 0.3,
};
const MIN_ACTIVE_JOBS_FOR_DELAY_ALERT = 3;
const RECOVERY_THRESHOLDS = {
  oldestQueuedAgeSeconds: 300,
  averageProcessingDelaySeconds: 180,
  errorRate: 0.2,
  workerFailureRate: 0.15,
};

const ALERT_MESSAGES = {
  dependencyOutageTriggered: "Queue dependency outage detected.",
  dependencyOutageResolved: "Queue dependency outage resolved.",
  workerReportTriggered: "Report worker heartbeat stale.",
  workerSnapshotTriggered: "Snapshot worker heartbeat stale.",
  queueLagTriggered: "Queue lag threshold exceeded.",
  processingDelayTriggered: "Average queue processing delay threshold exceeded.",
  errorRateTriggered: "Queue error rate threshold exceeded.",
  workerFailureRateTriggered: "Worker failure rate threshold exceeded.",
  workerReportResolved: "Report worker heartbeat recovered.",
  workerSnapshotResolved: "Snapshot worker heartbeat recovered.",
  queueLagResolved: "Queue lag recovered.",
  processingDelayResolved: "Average queue processing delay recovered.",
  errorRateResolved: "Queue error rate recovered.",
  workerFailureRateResolved: "Worker failure rate recovered.",
} as const;

type OperationalAlertRow = {
  id: number;
  context: unknown;
};

function secondsSince(iso: string | null): number {
  if (!iso) {
    return Number.POSITIVE_INFINITY;
  }
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, Math.floor((Date.now() - value) / 1000));
}

function clampFailureRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return Number(value.toFixed(4));
}

async function getQueueSize(queue: QueueName): Promise<number> {
  const admin = createSupabaseAdminClient("worker");
  const { count, error } = await admin
    .from(queue)
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "processing"]);
  if (error) {
    throw error;
  }
  return count ?? 0;
}

async function getQueueTimingMetrics(queue: QueueName): Promise<{
  oldestQueuedAgeSeconds: number;
  averageProcessingDelaySeconds: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const nowMs = Date.now();

  const { data: queued, error: queuedError } = await admin
    .from(queue)
    .select("created_at")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);
  if (queuedError) {
    throw queuedError;
  }

  const oldestQueuedCreatedAt =
    Array.isArray(queued) && queued.length > 0 ? queued[0]?.created_at : null;
  const oldestQueuedMs = oldestQueuedCreatedAt
    ? new Date(oldestQueuedCreatedAt).getTime()
    : NaN;
  const oldestQueuedAgeSeconds = Number.isFinite(oldestQueuedMs)
    ? Math.max(0, Math.floor((nowMs - oldestQueuedMs) / 1000))
    : 0;

  const { data: recent, error: recentError } = await admin
    .from(queue)
    .select("created_at, locked_at, completed_at, status")
    .eq("status", "processing")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (recentError) {
    throw recentError;
  }

  const rows = (recent ?? []) as QueueAgeRow[];
  const delays = rows
    .map((row) => {
      const createdMs = new Date(row.created_at).getTime();
      if (!Number.isFinite(createdMs)) {
        return null;
      }
      const processingStartMs = row.locked_at
        ? new Date(row.locked_at).getTime()
        : row.completed_at
          ? new Date(row.completed_at).getTime()
          : NaN;
      if (!Number.isFinite(processingStartMs)) {
        return null;
      }
      const deltaSeconds = Math.floor((processingStartMs - createdMs) / 1000);
      return deltaSeconds >= 0 ? deltaSeconds : null;
    })
    .filter((value): value is number => Number.isFinite(value));

  const averageProcessingDelaySeconds =
    delays.length > 0
      ? Math.round(delays.reduce((sum, value) => sum + value, 0) / delays.length)
      : 0;

  return { oldestQueuedAgeSeconds, averageProcessingDelaySeconds };
}

async function getQueueFailureRate(queue: QueueName): Promise<number> {
  const admin = createSupabaseAdminClient("worker");
  const sinceIso = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from(queue)
    .select("status")
    .gte("updated_at", sinceIso)
    .in("status", ["complete", "failed"]);
  if (error) {
    throw error;
  }

  const rows = (data ?? []) as JobStatusRow[];
  if (rows.length === 0) {
    return 0;
  }
  const failures = rows.filter((row) => row.status === "failed").length;
  return clampFailureRate(failures / rows.length);
}

export async function recordQueueWorkerHeartbeat(input: {
  workerName: WorkerName;
  queueName: QueueName;
  scanned: number;
  claimed: number;
  completed: number;
  failed: number;
  requeued: number;
  poisoned: number;
  oldestQueuedAgeSeconds: number;
  averageProcessingDelaySeconds: number;
  failureRate: number;
}): Promise<void> {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  await admin.from("queue_worker_heartbeats").upsert(
    {
      worker_name: input.workerName,
      queue_name: input.queueName,
      last_seen_at: nowIso,
      last_run_started_at: nowIso,
      last_run_completed_at: nowIso,
      last_scanned: input.scanned,
      last_claimed: input.claimed,
      last_completed: input.completed,
      last_failed: input.failed,
      last_requeued: input.requeued,
      last_poisoned: input.poisoned,
      last_failure_rate: clampFailureRate(input.failureRate),
      last_oldest_queued_age_seconds: Math.max(0, input.oldestQueuedAgeSeconds),
      last_average_processing_delay_seconds: Math.max(
        0,
        input.averageProcessingDelaySeconds,
      ),
      updated_at: nowIso,
    },
    { onConflict: "worker_name" },
  );
}

export async function collectQueueHealthSnapshot(): Promise<QueueHealthSnapshot> {
  const [reportSize, snapshotSize, reportLag, snapshotLag, reportFailure, snapshotFailure] =
    await Promise.all([
      getQueueSize("report_jobs"),
      getQueueSize("free_snapshot_jobs"),
      getQueueTimingMetrics("report_jobs"),
      getQueueTimingMetrics("free_snapshot_jobs"),
      getQueueFailureRate("report_jobs"),
      getQueueFailureRate("free_snapshot_jobs"),
    ]);

  const admin = createSupabaseAdminClient("worker");
  const { data: workerRows, error: workerError } = await admin
    .from("queue_worker_heartbeats")
    .select(
      "worker_name, queue_name, last_seen_at, last_failure_rate, last_claimed, last_completed, last_failed, last_requeued, last_poisoned, last_oldest_queued_age_seconds, last_average_processing_delay_seconds",
    )
    .in("worker_name", ["report_worker", "snapshot_worker"]);
  if (workerError) {
    throw workerError;
  }

  const rows = (workerRows ?? []) as WorkerHeartbeatRow[];
  const reportWorker = rows.find((row) => row.worker_name === "report_worker") ?? null;
  const snapshotWorker =
    rows.find((row) => row.worker_name === "snapshot_worker") ?? null;

  const reportAlive = reportWorker
    ? secondsSince(reportWorker.last_seen_at) <= WORKER_STALE_SECONDS
    : false;
  const snapshotAlive = snapshotWorker
    ? secondsSince(snapshotWorker.last_seen_at) <= WORKER_STALE_SECONDS
    : false;

  const overallFailureRate = clampFailureRate((reportFailure + snapshotFailure) / 2);
  const overallWorkerFailureRate = clampFailureRate(
    ((reportWorker?.last_failure_rate ?? 0) + (snapshotWorker?.last_failure_rate ?? 0)) /
      2,
  );
  const overallOldest = Math.max(
    reportLag.oldestQueuedAgeSeconds,
    snapshotLag.oldestQueuedAgeSeconds,
  );
  const overallDelay = Math.max(
    reportLag.averageProcessingDelaySeconds,
    snapshotLag.averageProcessingDelaySeconds,
  );

  return {
    generatedAt: new Date().toISOString(),
    queueSize: {
      report: reportSize,
      snapshot: snapshotSize,
      total: reportSize + snapshotSize,
    },
    oldestQueuedAgeSeconds: {
      report: reportLag.oldestQueuedAgeSeconds,
      snapshot: snapshotLag.oldestQueuedAgeSeconds,
      overall: overallOldest,
    },
    averageProcessingDelaySeconds: {
      report: reportLag.averageProcessingDelaySeconds,
      snapshot: snapshotLag.averageProcessingDelaySeconds,
      overall: overallDelay,
    },
    failureRate: {
      report: reportFailure,
      snapshot: snapshotFailure,
      overall: overallFailureRate,
    },
    workerFailureRate: {
      report: clampFailureRate(reportWorker?.last_failure_rate ?? 0),
      snapshot: clampFailureRate(snapshotWorker?.last_failure_rate ?? 0),
      overall: overallWorkerFailureRate,
    },
    dependencies: {
      supabase: true,
    },
    workerStatus: {
      report: {
        lastSeenAt: reportWorker?.last_seen_at ?? null,
        alive: reportAlive,
        lastClaimed: reportWorker?.last_claimed ?? 0,
        lastCompleted: reportWorker?.last_completed ?? 0,
        lastFailed: reportWorker?.last_failed ?? 0,
        lastRequeued: reportWorker?.last_requeued ?? 0,
        lastPoisoned: reportWorker?.last_poisoned ?? 0,
      },
      snapshot: {
        lastSeenAt: snapshotWorker?.last_seen_at ?? null,
        alive: snapshotAlive,
        lastClaimed: snapshotWorker?.last_claimed ?? 0,
        lastCompleted: snapshotWorker?.last_completed ?? 0,
        lastFailed: snapshotWorker?.last_failed ?? 0,
        lastRequeued: snapshotWorker?.last_requeued ?? 0,
        lastPoisoned: snapshotWorker?.last_poisoned ?? 0,
      },
    },
  };
}

async function latestAlertForSource(source: string): Promise<OperationalAlertRow | null> {
  const admin = createSupabaseAdminClient("worker");
  const { data } = await admin
    .from("operational_alerts")
    .select("id, context")
    .eq("source", source)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const row = data[0] as { id: unknown; context: unknown };
  return {
    id: typeof row.id === "number" ? row.id : Number(row.id ?? 0),
    context: row.context ?? null,
  };
}

function alertIsResolved(row: OperationalAlertRow | null): boolean {
  if (!row || !row.context || typeof row.context !== "object" || Array.isArray(row.context)) {
    return false;
  }
  const resolvedAt = (row.context as Record<string, unknown>).resolved_at;
  return typeof resolvedAt === "string" && resolvedAt.trim().length > 0;
}

function alertIsActive(row: OperationalAlertRow | null): boolean {
  return !!row && !alertIsResolved(row);
}

type IncidentTransition = {
  severity: "warning" | "high" | "critical";
  source: string;
  triggerMessage: string;
  resolvedMessage: string;
  breached: boolean;
  triggerContext: Record<string, unknown>;
  resolvedContext: Record<string, unknown>;
};

async function applyIncidentTransition(transition: IncidentTransition): Promise<void> {
  const latest = await latestAlertForSource(transition.source);
  const active = alertIsActive(latest);

  if (transition.breached && !active) {
    await emitOperationalAlert({
      severity: transition.severity,
      source: transition.source,
      message: transition.triggerMessage,
      context: {
        incident_event: "start",
        incident_state: "open",
        started_at: new Date().toISOString(),
        ...transition.triggerContext,
      },
    });
    return;
  }

  if (!transition.breached && active) {
    await emitOperationalAlert({
      severity: "warning",
      source: transition.source,
      message: transition.resolvedMessage,
      context: {
        incident_event: "end",
        incident_state: "resolved",
        resolved_at: new Date().toISOString(),
        ...transition.resolvedContext,
      },
    });
  }
}

export async function evaluateQueueDependencyHealth(input: {
  healthy: boolean;
  errorMessage?: string;
}): Promise<void> {
  await applyIncidentTransition({
    severity: "critical",
    source: "queue.dependency.supabase",
    triggerMessage: ALERT_MESSAGES.dependencyOutageTriggered,
    resolvedMessage: ALERT_MESSAGES.dependencyOutageResolved,
    breached: !input.healthy,
    triggerContext: {
      dependency: "supabase",
      error: input.errorMessage ?? "dependency_unavailable",
    },
    resolvedContext: {
      dependency: "supabase",
    },
  });
}

export async function evaluateQueueHealthAlerts(
  snapshot: QueueHealthSnapshot,
): Promise<void> {
  const reportWorkerRequired =
    snapshot.queueSize.report > 0 || snapshot.oldestQueuedAgeSeconds.report > 0;
  const snapshotWorkerRequired =
    snapshot.queueSize.snapshot > 0 || snapshot.oldestQueuedAgeSeconds.snapshot > 0;

  const reportWorkerBreached = reportWorkerRequired && !snapshot.workerStatus.report.alive;
  const snapshotWorkerBreached =
    snapshotWorkerRequired && !snapshot.workerStatus.snapshot.alive;
  const queueLagBreached =
    snapshot.oldestQueuedAgeSeconds.overall >= ALERT_THRESHOLDS.oldestQueuedAgeSeconds;
  const processingDelayBreached =
    snapshot.queueSize.total >= MIN_ACTIVE_JOBS_FOR_DELAY_ALERT &&
    snapshot.averageProcessingDelaySeconds.overall >=
      ALERT_THRESHOLDS.averageProcessingDelaySeconds;
  const errorRateBreached = snapshot.failureRate.overall >= ALERT_THRESHOLDS.errorRate;
  const workerFailureRateBreached =
    snapshot.workerFailureRate.overall >= ALERT_THRESHOLDS.workerFailureRate;

  await applyIncidentTransition({
    severity: "high",
    source: "queue.worker.report",
    triggerMessage: ALERT_MESSAGES.workerReportTriggered,
    resolvedMessage: ALERT_MESSAGES.workerReportResolved,
    breached: reportWorkerBreached,
    triggerContext: {
      worker: "report_worker",
      metric: "worker_heartbeat_stale",
      metric_value_seconds_since_last_seen: secondsSince(
        snapshot.workerStatus.report.lastSeenAt,
      ),
      threshold_seconds: WORKER_STALE_SECONDS,
      last_seen_at: snapshot.workerStatus.report.lastSeenAt,
    },
    resolvedContext: {
      worker: "report_worker",
      metric: "worker_heartbeat_stale",
      metric_value_seconds_since_last_seen: secondsSince(
        snapshot.workerStatus.report.lastSeenAt,
      ),
      threshold_seconds: WORKER_STALE_SECONDS,
      last_seen_at: snapshot.workerStatus.report.lastSeenAt,
    },
  });

  await applyIncidentTransition({
    severity: "high",
    source: "queue.worker.snapshot",
    triggerMessage: ALERT_MESSAGES.workerSnapshotTriggered,
    resolvedMessage: ALERT_MESSAGES.workerSnapshotResolved,
    breached: snapshotWorkerBreached,
    triggerContext: {
      worker: "snapshot_worker",
      metric: "worker_heartbeat_stale",
      metric_value_seconds_since_last_seen: secondsSince(
        snapshot.workerStatus.snapshot.lastSeenAt,
      ),
      threshold_seconds: WORKER_STALE_SECONDS,
      last_seen_at: snapshot.workerStatus.snapshot.lastSeenAt,
    },
    resolvedContext: {
      worker: "snapshot_worker",
      metric: "worker_heartbeat_stale",
      metric_value_seconds_since_last_seen: secondsSince(
        snapshot.workerStatus.snapshot.lastSeenAt,
      ),
      threshold_seconds: WORKER_STALE_SECONDS,
      last_seen_at: snapshot.workerStatus.snapshot.lastSeenAt,
    },
  });

  await applyIncidentTransition({
    severity: "high",
    source: "queue.lag",
    triggerMessage: ALERT_MESSAGES.queueLagTriggered,
    resolvedMessage: ALERT_MESSAGES.queueLagResolved,
    breached: queueLagBreached,
    triggerContext: {
      metric: "queue_lag_seconds",
      metric_value: snapshot.oldestQueuedAgeSeconds.overall,
      threshold: ALERT_THRESHOLDS.oldestQueuedAgeSeconds,
      report_metric_value: snapshot.oldestQueuedAgeSeconds.report,
      snapshot_metric_value: snapshot.oldestQueuedAgeSeconds.snapshot,
    },
    resolvedContext: {
      metric: "queue_lag_seconds",
      metric_value: snapshot.oldestQueuedAgeSeconds.overall,
      threshold: RECOVERY_THRESHOLDS.oldestQueuedAgeSeconds,
      report_metric_value: snapshot.oldestQueuedAgeSeconds.report,
      snapshot_metric_value: snapshot.oldestQueuedAgeSeconds.snapshot,
    },
  });

  await applyIncidentTransition({
    severity: "warning",
    source: "queue.processing_delay",
    triggerMessage: ALERT_MESSAGES.processingDelayTriggered,
    resolvedMessage: ALERT_MESSAGES.processingDelayResolved,
    breached: processingDelayBreached,
    triggerContext: {
      metric: "processing_delay_seconds",
      metric_value: snapshot.averageProcessingDelaySeconds.overall,
      threshold: ALERT_THRESHOLDS.averageProcessingDelaySeconds,
      active_job_count: snapshot.queueSize.total,
      min_active_jobs_threshold: MIN_ACTIVE_JOBS_FOR_DELAY_ALERT,
    },
    resolvedContext: {
      metric: "processing_delay_seconds",
      metric_value: snapshot.averageProcessingDelaySeconds.overall,
      threshold: RECOVERY_THRESHOLDS.averageProcessingDelaySeconds,
      active_job_count: snapshot.queueSize.total,
      min_active_jobs_threshold: MIN_ACTIVE_JOBS_FOR_DELAY_ALERT,
    },
  });

  await applyIncidentTransition({
    severity: "critical",
    source: "queue.error_rate",
    triggerMessage: ALERT_MESSAGES.errorRateTriggered,
    resolvedMessage: ALERT_MESSAGES.errorRateResolved,
    breached: errorRateBreached,
    triggerContext: {
      metric: "queue_error_rate",
      metric_value: snapshot.failureRate.overall,
      threshold: ALERT_THRESHOLDS.errorRate,
      report_metric_value: snapshot.failureRate.report,
      snapshot_metric_value: snapshot.failureRate.snapshot,
    },
    resolvedContext: {
      metric: "queue_error_rate",
      metric_value: snapshot.failureRate.overall,
      threshold: RECOVERY_THRESHOLDS.errorRate,
      report_metric_value: snapshot.failureRate.report,
      snapshot_metric_value: snapshot.failureRate.snapshot,
    },
  });

  await applyIncidentTransition({
    severity: "high",
    source: "queue.worker_failure_rate",
    triggerMessage: ALERT_MESSAGES.workerFailureRateTriggered,
    resolvedMessage: ALERT_MESSAGES.workerFailureRateResolved,
    breached: workerFailureRateBreached,
    triggerContext: {
      metric: "worker_failure_rate",
      metric_value: snapshot.workerFailureRate.overall,
      threshold: ALERT_THRESHOLDS.workerFailureRate,
      report_metric_value: snapshot.workerFailureRate.report,
      snapshot_metric_value: snapshot.workerFailureRate.snapshot,
    },
    resolvedContext: {
      metric: "worker_failure_rate",
      metric_value: snapshot.workerFailureRate.overall,
      threshold: RECOVERY_THRESHOLDS.workerFailureRate,
      report_metric_value: snapshot.workerFailureRate.report,
      snapshot_metric_value: snapshot.workerFailureRate.snapshot,
    },
  });
}
