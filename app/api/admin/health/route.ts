import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";

export async function GET() {
  const requestId = randomUUID();
  const { response } = await requireApiRole(["admin", "super_admin"]);

  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const [rateLimitReady, reportCompletionReady] = await Promise.all([
    runRateLimitStartupCheck(),
    runReportCompletionStartupCheck(),
  ]);
  const healthy = rateLimitReady && reportCompletionReady;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        rate_limit_rpc: rateLimitReady ? "ok" : "failed",
        report_completion_rpc: reportCompletionReady ? "ok" : "failed",
      },
    },
    { status: healthy ? 200 : 503, headers: { "x-request-id": requestId } },
  );
}
