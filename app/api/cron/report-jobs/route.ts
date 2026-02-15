import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { CRON_SECRET, NODE_ENV } from "@/lib/env";
import { runReportJobWorker } from "@/features/reports/services/reportJobQueueService";

function isAuthorized(request: NextRequest) {
  if (!CRON_SECRET) {
    return NODE_ENV !== "production";
  }

  const provided = request.headers.get("x-cron-secret");
  return Boolean(provided && provided === CRON_SECRET);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron.report_jobs_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReportJobWorker();
  return NextResponse.json({ ok: true, ...result });
}
