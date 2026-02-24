import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { runRateLimitStartupCheck } from "@/features/usage/services/rateLimitService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";
import { runDbContractStartupCheck } from "@/features/db/services/dbContractStartupService";
import { verifySnapshotPdfPipelineReady } from "@/features/free-snapshot/pdf/generateSnapshotPdf";
import { ENABLE_SUPABASE_STARTUP_CHECKS } from "@/lib/env";

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

  let pdfReadiness:
    | {
        isReady: boolean;
        sizeBytes: number;
        error?: string;
      }
    | null = null;

  if (runDeep) {
    try {
      pdfReadiness = await verifySnapshotPdfPipelineReady();
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
    },
    {
      status: statusCodeFor(overallStatus),
      headers: { "x-request-id": requestId },
    },
  );
}
