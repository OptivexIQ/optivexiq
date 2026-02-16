import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";
import { runDbContractStartupCheck } from "@/features/db/services/dbContractStartupService";
import { verifySnapshotPdfPipelineReady } from "@/features/free-snapshot/pdf/generateSnapshotPdf";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const { response } = await requireApiRole(["admin", "super_admin"]);

  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const url = new URL(request.url);
  const deepParam = url.searchParams.get("deep");
  const runDeep = deepParam === "1" || deepParam === "true";

  const [rateLimitReady, reportCompletionReady, dbContractReady] = await Promise.all([
    runRateLimitStartupCheck(),
    runReportCompletionStartupCheck(),
    runDbContractStartupCheck(),
  ]);
  const pdfReadiness = runDeep
    ? await verifySnapshotPdfPipelineReady()
    : null;

  const healthy =
    rateLimitReady &&
    reportCompletionReady &&
    dbContractReady &&
    (pdfReadiness ? pdfReadiness.isReady : true);

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: {
        rate_limit_rpc: rateLimitReady ? "ok" : "failed",
        report_completion_rpc: reportCompletionReady ? "ok" : "failed",
        db_contract_snapshot: dbContractReady ? "ok" : "failed",
        ...(pdfReadiness
          ? {
              free_snapshot_pdf_pipeline: pdfReadiness.isReady
                ? "ok"
                : "failed",
              free_snapshot_pdf_size_bytes: pdfReadiness.sizeBytes,
              free_snapshot_pdf_error: pdfReadiness.error ?? null,
            }
          : {}),
      },
    },
    { status: healthy ? 200 : 503, headers: { "x-request-id": requestId } },
  );
}
