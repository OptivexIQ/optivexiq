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
const ALERT_COOLDOWN_MINUTES = 15;
const ALERT_THRESHOLDS = {
  oldestQueuedAgeSeconds: 600,
  averageProcessingDelaySeconds: 300,
  failureRate: 0.35,
};
const MIN_ACTIVE_JOBS_FOR_DELAY_ALERT = 3;
const RECOVERY_THRESHOLDS = {
  oldestQueuedAgeSeconds: 300,
  averageProcessingDelaySeconds: 180,
  failureRate: 0.2,
};

const ALERT_MESSAGES = {
  workerReportTriggered: "Report worker heartbeat stale.",
  workerSnapshotTriggered: "Snapshot worker heartbeat stale.",
  queueLagTriggered: "Queue lag threshold exceeded.",
  processingDelayTriggered: "Average queue processing delay threshold exceeded.",
  failureRateTriggered: "Queue failure rate threshold exceeded.",
  workerReportResolved: "Report worker heartbeat recovered.",
  workerSnapshotResolved: "Snapshot worker heartbeat recovered.",
  queueLagResolved: "Queue lag recovered.",
  processingDelayResolved: "Average queue processing delay recovered.",
  failureRateResolved: "Queue failure rate recovered.",
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
  const { count } = await admin
    .from(queue)
    .select("id", { count: "exact", head: true })
    .in("status", ["queued", "processing"]);
  return count ?? 0;
}

async function getQueueTimingMetrics(queue: QueueName): Promise<{
  oldestQueuedAgeSeconds: number;
  averageProcessingDelaySeconds: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const nowMs = Date.now();

  const { data: queued } = await admin
    .from(queue)
    .select("created_at")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);

  const oldestQueuedCreatedAt =
    Array.isArray(queued) && queued.length > 0 ? queued[0]?.created_at : null;
  const oldestQueuedMs = oldestQueuedCreatedAt
    ? new Date(oldestQueuedCreatedAt).getTime()
    : NaN;
  const oldestQueuedAgeSeconds = Number.isFinite(oldestQueuedMs)
    ? Math.max(0, Math.floor((nowMs - oldestQueuedMs) / 1000))
    : 0;

  const { data: recent } = await admin
    .from(queue)
    .select("created_at, locked_at, completed_at, status")
    .eq("status", "processing")
    .order("updated_at", { ascending: false })
    .limit(200);

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
  const { data } = await admin
    .from(queue)
    .select("status")
    .gte("updated_at", sinceIso)
    .in("status", ["complete", "failed"]);

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
  const { data: workerRows } = await admin
    .from("queue_worker_heartbeats")
    .select(
      "worker_name, queue_name, last_seen_at, last_failure_rate, last_claimed, last_completed, last_failed, last_requeued, last_poisoned, last_oldest_queued_age_seconds, last_average_processing_delay_seconds",
    )
    .in("worker_name", ["report_worker", "snapshot_worker"]);

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

async function recentlyAlerted(source: string, message: string): Promise<boolean> {
  const admin = createSupabaseAdminClient("worker");
  const sinceIso = new Date(
    Date.now() - ALERT_COOLDOWN_MINUTES * 60 * 1000,
  ).toISOString();
  const { data } = await admin
    .from("operational_alerts")
    .select("id")
    .eq("source", source)
    .eq("message", message)
    .gte("created_at", sinceIso)
    .limit(1);

  return Array.isArray(data) && data.length > 0;
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

export async function evaluateQueueHealthAlerts(
  snapshot: QueueHealthSnapshot,
): Promise<void> {
  const alerts: Array<{
    severity: "warning" | "high" | "critical";
    source: string;
    message: string;
    context: Record<string, unknown>;
  }> = [];

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
  const failureRateBreached = snapshot.failureRate.overall >= ALERT_THRESHOLDS.failureRate;

  if (reportWorkerBreached) {
    alerts.push({
      severity: "high",
      source: "queue.worker.report",
      message: ALERT_MESSAGES.workerReportTriggered,
      context: {
        worker: "report_worker",
        last_seen_at: snapshot.workerStatus.report.lastSeenAt,
      },
    });
  }

  if (snapshotWorkerBreached) {
    alerts.push({
      severity: "high",
      source: "queue.worker.snapshot",
      message: ALERT_MESSAGES.workerSnapshotTriggered,
      context: {
        worker: "snapshot_worker",
        last_seen_at: snapshot.workerStatus.snapshot.lastSeenAt,
      },
    });
  }

  if (queueLagBreached) {
    alerts.push({
      severity: "high",
      source: "queue.lag",
      message: ALERT_MESSAGES.queueLagTriggered,
      context: {
        oldest_queued_age_seconds: snapshot.oldestQueuedAgeSeconds.overall,
        report_oldest_age_seconds: snapshot.oldestQueuedAgeSeconds.report,
        snapshot_oldest_age_seconds: snapshot.oldestQueuedAgeSeconds.snapshot,
      },
    });
  }

  if (processingDelayBreached) {
    alerts.push({
      severity: "warning",
        source: "queue.processing_delay",
        message: ALERT_MESSAGES.processingDelayTriggered,
        context: {
          average_processing_delay_seconds:
            snapshot.averageProcessingDelaySeconds.overall,
          active_job_count: snapshot.queueSize.total,
        },
      });
  }

  if (failureRateBreached) {
    alerts.push({
      severity: "critical",
      source: "queue.failure_rate",
      message: ALERT_MESSAGES.failureRateTriggered,
      context: {
        overall_failure_rate: snapshot.failureRate.overall,
        report_failure_rate: snapshot.failureRate.report,
        snapshot_failure_rate: snapshot.failureRate.snapshot,
      },
    });
  }

  for (const alert of alerts) {
    if (await recentlyAlerted(alert.source, alert.message)) {
      continue;
    }
    await emitOperationalAlert({
      severity: alert.severity,
      source: alert.source,
      message: alert.message,
      context: alert.context,
    });
  }

  const latestBySource = await Promise.all([
    latestAlertForSource("queue.worker.report"),
    latestAlertForSource("queue.worker.snapshot"),
    latestAlertForSource("queue.lag"),
    latestAlertForSource("queue.processing_delay"),
    latestAlertForSource("queue.failure_rate"),
  ]);

  const [latestWorkerReport, latestWorkerSnapshot, latestQueueLag, latestDelay, latestFailure] =
    latestBySource;

  const recoveries: Array<{
    active: boolean;
    stillBreached: boolean;
    source: string;
    message: string;
    context: Record<string, unknown>;
  }> = [
    {
      active: !!latestWorkerReport && !alertIsResolved(latestWorkerReport),
      stillBreached: reportWorkerBreached,
      source: "queue.worker.report",
      message: ALERT_MESSAGES.workerReportResolved,
      context: {
        worker: "report_worker",
        resolved_at: new Date().toISOString(),
        last_seen_at: snapshot.workerStatus.report.lastSeenAt,
      },
    },
    {
      active: !!latestWorkerSnapshot && !alertIsResolved(latestWorkerSnapshot),
      stillBreached: snapshotWorkerBreached,
      source: "queue.worker.snapshot",
      message: ALERT_MESSAGES.workerSnapshotResolved,
      context: {
        worker: "snapshot_worker",
        resolved_at: new Date().toISOString(),
        last_seen_at: snapshot.workerStatus.snapshot.lastSeenAt,
      },
    },
    {
      active: !!latestQueueLag && !alertIsResolved(latestQueueLag),
      stillBreached:
        snapshot.oldestQueuedAgeSeconds.overall >= RECOVERY_THRESHOLDS.oldestQueuedAgeSeconds,
      source: "queue.lag",
      message: ALERT_MESSAGES.queueLagResolved,
      context: {
        resolved_at: new Date().toISOString(),
        oldest_queued_age_seconds: snapshot.oldestQueuedAgeSeconds.overall,
        report_oldest_age_seconds: snapshot.oldestQueuedAgeSeconds.report,
        snapshot_oldest_age_seconds: snapshot.oldestQueuedAgeSeconds.snapshot,
      },
    },
    {
      active: !!latestDelay && !alertIsResolved(latestDelay),
      stillBreached:
        snapshot.queueSize.total >= MIN_ACTIVE_JOBS_FOR_DELAY_ALERT &&
        snapshot.averageProcessingDelaySeconds.overall >=
        RECOVERY_THRESHOLDS.averageProcessingDelaySeconds,
      source: "queue.processing_delay",
      message: ALERT_MESSAGES.processingDelayResolved,
      context: {
        resolved_at: new Date().toISOString(),
        average_processing_delay_seconds: snapshot.averageProcessingDelaySeconds.overall,
        active_job_count: snapshot.queueSize.total,
      },
    },
    {
      active: !!latestFailure && !alertIsResolved(latestFailure),
      stillBreached: snapshot.failureRate.overall >= RECOVERY_THRESHOLDS.failureRate,
      source: "queue.failure_rate",
      message: ALERT_MESSAGES.failureRateResolved,
      context: {
        resolved_at: new Date().toISOString(),
        overall_failure_rate: snapshot.failureRate.overall,
        report_failure_rate: snapshot.failureRate.report,
        snapshot_failure_rate: snapshot.failureRate.snapshot,
      },
    },
  ];

  for (const recovery of recoveries) {
    if (!recovery.active || recovery.stillBreached) {
      continue;
    }
    if (await recentlyAlerted(recovery.source, recovery.message)) {
      continue;
    }
    await emitOperationalAlert({
      severity: "warning",
      source: recovery.source,
      message: recovery.message,
      context: recovery.context,
    });
  }
}
