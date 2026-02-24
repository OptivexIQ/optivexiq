import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { collectQueueHealthSnapshot } from "@/features/ops/services/queueReliabilityService";

const MAX_OLDEST_QUEUED_AGE_SECONDS = 600;
const MAX_AVERAGE_DELAY_SECONDS = 300;
const MAX_FAILURE_RATE = 0.35;
const MAX_WORKER_FAILURE_RATE = 0.3;

export async function GET() {
  const requestId = randomUUID();
  const { response } = await requireApiRole(["admin", "super_admin"]);
  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const snapshot = await collectQueueHealthSnapshot();
  const reportWorkerRequired =
    snapshot.queueSize.report > 0 || snapshot.oldestQueuedAgeSeconds.report > 0;
  const snapshotWorkerRequired =
    snapshot.queueSize.snapshot > 0 || snapshot.oldestQueuedAgeSeconds.snapshot > 0;
  const workersHealthy =
    (!reportWorkerRequired || snapshot.workerStatus.report.alive) &&
    (!snapshotWorkerRequired || snapshot.workerStatus.snapshot.alive);
  const lagHealthy =
    snapshot.oldestQueuedAgeSeconds.overall <= MAX_OLDEST_QUEUED_AGE_SECONDS &&
    snapshot.averageProcessingDelaySeconds.overall <= MAX_AVERAGE_DELAY_SECONDS;
  const failureHealthy = snapshot.failureRate.overall <= MAX_FAILURE_RATE;
  const workerFailureHealthy =
    snapshot.workerFailureRate.overall <= MAX_WORKER_FAILURE_RATE;
  const dependencyHealthy = snapshot.dependencies.supabase;
  const healthy =
    workersHealthy &&
    lagHealthy &&
    failureHealthy &&
    workerFailureHealthy &&
    dependencyHealthy;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      queueSize: snapshot.queueSize,
      oldestQueuedAgeSeconds: snapshot.oldestQueuedAgeSeconds,
      averageProcessingDelaySeconds: snapshot.averageProcessingDelaySeconds,
      failureRate: snapshot.failureRate,
      workerFailureRate: snapshot.workerFailureRate,
      dependencies: snapshot.dependencies,
      workerStatus: snapshot.workerStatus,
      thresholds: {
        oldestQueuedAgeSeconds: MAX_OLDEST_QUEUED_AGE_SECONDS,
        averageProcessingDelaySeconds: MAX_AVERAGE_DELAY_SECONDS,
        failureRate: MAX_FAILURE_RATE,
        workerFailureRate: MAX_WORKER_FAILURE_RATE,
      },
      generatedAt: snapshot.generatedAt,
    },
    { status: healthy ? 200 : 503, headers: { "x-request-id": requestId } },
  );
}
