import { NextResponse, type NextRequest } from "next/server";
import { CRON_SECRET, NODE_ENV } from "@/lib/env";
import { logger } from "@/lib/logger";
import { runFreeSnapshotJobWorker } from "@/features/free-snapshot/services/freeSnapshotJobQueueService";

function isAuthorized(request: NextRequest) {
  if (!CRON_SECRET) {
    return NODE_ENV !== "production";
  }

  const provided = request.headers.get("x-cron-secret");
  return Boolean(provided && provided === CRON_SECRET);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron.free_snapshot_jobs_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runFreeSnapshotJobWorker();
  logger.info("cron.free_snapshot_jobs_completed", {
    scanned: result.scanned,
    claimed: result.claimed,
    completed: result.completed,
    failed: result.failed,
    failure_rate: result.failureRate,
  });
  return NextResponse.json({ ok: true, ...result });
}
