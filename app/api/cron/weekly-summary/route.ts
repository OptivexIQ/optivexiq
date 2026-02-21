import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { runWeeklySummaryCron } from "@/features/settings/services/weeklySummaryCronService";
import { isAuthorizedCronRequest } from "@/lib/cron/isAuthorizedCronRequest";

async function run(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    logger.warn("cron.weekly_summary_unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runWeeklySummaryCron();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ...result });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
