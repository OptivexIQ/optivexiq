import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { runFreeSnapshotJobWorker } from "@/features/free-snapshot/services/freeSnapshotJobQueueService";
import { isAuthorizedCronRequest } from "@/lib/cron/isAuthorizedCronRequest";

async function run(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
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

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
