import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";
import { runDbContractStartupCheck } from "@/features/db/services/dbContractStartupService";
import { verifySnapshotPdfPipelineReady } from "@/features/free-snapshot/pdf/generateSnapshotPdf";
import { ENABLE_SUPABASE_STARTUP_CHECKS } from "@/lib/env";
import { getAdminOpsSnapshot } from "@/features/ops/services/adminHealthSnapshotService";

type AdminHealthLevel = "Healthy" | "Degraded" | "Maintenance" | "Unknown";
type CheckCategory = "mandatory" | "optional" | "diagnostic";
type CheckState = "pass" | "fail" | "skipped" | "unknown";

type HealthCheck = {
  key: string;
  category: CheckCategory;
  enabled: boolean;
  state: CheckState;
  detail?: string;
};

function toLegacyCheckState(state: CheckState): "ok" | "failed" | "skipped" | "unknown" {
  if (state === "pass") {
    return "ok";
  }
  if (state === "fail") {
    return "failed";
  }
  if (state === "skipped") {
    return "skipped";
  }
  return "unknown";
}

function determineOverallStatus(checks: HealthCheck[]): AdminHealthLevel {
  const hasUnknown = checks.some(
    (check) => check.category !== "diagnostic" && check.state === "unknown",
  );
  if (hasUnknown) {
    return "Unknown";
  }

  const hasMandatoryFailure = checks.some(
    (check) => check.category === "mandatory" && check.enabled && check.state === "fail",
  );
  if (hasMandatoryFailure) {
    return "Degraded";
  }

  const hasOptionalFailure = checks.some(
    (check) => check.category === "optional" && check.enabled && check.state === "fail",
  );
  if (hasOptionalFailure) {
    return "Degraded";
  }

  const optionalChecksDisabled = checks.some(
    (check) => check.category === "optional" && !check.enabled,
  );
  if (optionalChecksDisabled) {
    return "Maintenance";
  }

  return "Healthy";
}

function statusCodeFor(status: AdminHealthLevel): number {
  if (status === "Healthy") {
    return 200;
  }
  if (status === "Maintenance") {
    return 200;
  }
  if (status === "Degraded") {
    return 503;
  }
  return 500;
}

async function runCheck(
  key: string,
  category: CheckCategory,
  enabled: boolean,
  executor: () => Promise<boolean>,
  detailWhenSkipped: string,
): Promise<HealthCheck> {
  if (!enabled) {
    return {
      key,
      category,
      enabled: false,
      state: "skipped",
      detail: detailWhenSkipped,
    };
  }

  try {
    const ready = await executor();
    return {
      key,
      category,
      enabled: true,
      state: ready ? "pass" : "fail",
    };
  } catch {
    return {
      key,
      category,
      enabled: true,
      state: "unknown",
      detail: "Health check execution threw unexpectedly.",
    };
  }
}

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

  const startupChecksEnabled = ENABLE_SUPABASE_STARTUP_CHECKS;

  const [rateLimitCheck, reportCompletionCheck, dbContractCheck] = await Promise.all([
    runCheck(
      "rate_limit_rpc",
      "optional",
      startupChecksEnabled,
      runRateLimitStartupCheck,
      "Startup checks disabled by ENABLE_SUPABASE_STARTUP_CHECKS policy.",
    ),
    runCheck(
      "report_completion_rpc",
      "optional",
      startupChecksEnabled,
      runReportCompletionStartupCheck,
      "Startup checks disabled by ENABLE_SUPABASE_STARTUP_CHECKS policy.",
    ),
    runCheck(
      "db_contract_snapshot",
      "optional",
      startupChecksEnabled,
      runDbContractStartupCheck,
      "Startup checks disabled by ENABLE_SUPABASE_STARTUP_CHECKS policy.",
    ),
  ]);

  const checks: HealthCheck[] = [rateLimitCheck, reportCompletionCheck, dbContractCheck];
  const opsSnapshot = await getAdminOpsSnapshot();
  let subsystemSummary: {
    providers: Record<string, unknown>;
    queue: Record<string, unknown>;
    token_accounting: Record<string, unknown>;
    report_contract: Record<string, unknown>;
    scoring_governance: Record<string, unknown>;
  } = {
    providers: {
      rag: opsSnapshot.providers.rag,
      openai: opsSnapshot.providers.openai,
      supabase_service_role: opsSnapshot.providers.supabaseServiceRole,
      lemonsqueezy_webhook: opsSnapshot.providers.lemonsqueezyWebhook,
    },
    queue: {
      rag: opsSnapshot.queue.rag,
      depth_total: opsSnapshot.queue.depth,
      depth_report: opsSnapshot.queue.reportDepth,
      depth_snapshot: opsSnapshot.queue.snapshotDepth,
      oldest_queued_age_seconds: opsSnapshot.queue.oldestQueuedAgeSeconds,
      average_processing_delay_seconds: opsSnapshot.queue.averageProcessingDelaySeconds,
      failed_jobs_last_24h: opsSnapshot.queue.failedLast24h,
    },
    token_accounting: {
      rag: opsSnapshot.tokenAccounting.rag,
      pending_reconciliation_jobs: opsSnapshot.tokenAccounting.pendingReconciliations,
      oldest_pending_seconds: opsSnapshot.tokenAccounting.oldestPendingSeconds,
    },
    report_contract: {
      rag: opsSnapshot.reportContract.rag,
      report_completion_rpc: opsSnapshot.reportContract.reportCompletionRpc,
      db_contract_snapshot: opsSnapshot.reportContract.dbContractSnapshot,
    },
    scoring_governance: {
      rag: opsSnapshot.scoringGovernance.rag,
      model_version: opsSnapshot.scoringGovernance.modelVersion,
      days_since_calibration: opsSnapshot.scoringGovernance.daysSinceCalibration,
      training_sample_size: opsSnapshot.scoringGovernance.trainingSampleSize,
      drift_threshold: opsSnapshot.scoringGovernance.driftThreshold,
    },
  };

  let pdfReadiness:
    | {
        isReady: boolean;
        sizeBytes: number;
        error?: string;
      }
    | null = null;

  if (runDeep) {
    try {
      const pdfResult = await verifySnapshotPdfPipelineReady();
      pdfReadiness = pdfResult;
      checks.push({
        key: "free_snapshot_pdf_pipeline",
        category: "diagnostic",
        enabled: true,
        state: pdfReadiness.isReady ? "pass" : "fail",
        detail: pdfReadiness.error,
      });
    } catch {
      checks.push({
        key: "free_snapshot_pdf_pipeline",
        category: "diagnostic",
        enabled: true,
        state: "unknown",
        detail: "Diagnostic probe failed unexpectedly.",
      });
      subsystemSummary = {
        ...subsystemSummary,
        queue: { ...subsystemSummary.queue, pdf_probe: "failed" },
      };
    }
  } else {
    checks.push({
      key: "free_snapshot_pdf_pipeline",
      category: "diagnostic",
      enabled: false,
      state: "skipped",
      detail: "Diagnostic probe only runs when deep=1.",
    });
  }

  const overallStatus = determineOverallStatus(checks);

  return NextResponse.json(
    {
      status: overallStatus,
      policy: {
        startupChecksEnabled,
      },
      checks: Object.fromEntries(
        checks.map((check) => [
          check.key,
          {
            category: check.category,
            enabled: check.enabled,
            state: check.state,
            legacy: toLegacyCheckState(check.state),
            detail: check.detail ?? null,
          },
        ]),
      ),
      ...(pdfReadiness
        ? {
            diagnostics: {
              free_snapshot_pdf_size_bytes: pdfReadiness.sizeBytes,
              free_snapshot_pdf_error: pdfReadiness.error ?? null,
            },
          }
        : {}),
      subsystems: subsystemSummary,
    },
    {
      status: statusCodeFor(overallStatus),
      headers: { "x-request-id": requestId },
    },
  );
}
