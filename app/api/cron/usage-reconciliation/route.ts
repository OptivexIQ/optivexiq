import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { CRON_SECRET, NODE_ENV } from "@/lib/env";
import { runUsageReconciliationCron } from "@/features/usage/services/usageReconciliationCronService";

function isAuthorized(request: NextRequest) {
  if (!CRON_SECRET) {
    return NODE_ENV !== "production";
  }

  const provided = request.headers.get("x-cron-secret");
  return Boolean(provided && provided === CRON_SECRET);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    logger.warn("cron.usage_reconciliation_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runUsageReconciliationCron();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}

