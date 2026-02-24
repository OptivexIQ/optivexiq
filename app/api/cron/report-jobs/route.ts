import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { runReportJobWorker } from "@/features/reports/services/reportJobQueueService";
import { isAuthorizedCronRequest } from "@/lib/cron/isAuthorizedCronRequest";

async function run(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    logger.warn("cron.report_jobs_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReportJobWorker();
  logger.info("cron.report_jobs_completed", {
    scanned: result.scanned,
    claimed: result.claimed,
    completed: result.completed,
    failed: result.failed,
    requeued: result.requeued,
    poisoned: result.poisoned,
  });
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
