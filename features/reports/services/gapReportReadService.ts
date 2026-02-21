import { createSupabaseServerClient } from "@/services/supabase/server";
import { parseStoredReportData } from "@/features/reports/services/reportService";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";
import { logger } from "@/lib/logger";

export class ReportReadQueryError extends Error {
  readonly reportId: string;
  readonly userId: string;

  constructor(reportId: string, userId: string) {
    super("report_read_query_failed");
    this.name = "ReportReadQueryError";
    this.reportId = reportId;
    this.userId = userId;
  }
}

const VALID_STATUS = new Set([
  "queued",
  "running",
  "retrying",
  "completed",
  "failed",
]);
const VALID_STAGE = new Set([
  "queued",
  "scraping_homepage",
  "scraping_pricing",
  "scraping_competitors",
  "gap_analysis",
  "competitor_synthesis",
  "scoring",
  "rewrite_generation",
  "finalizing",
  "complete",
  "failed",
]);

function normalizeStatus(value: string | null): GapReportExecutionPayload["status"] {
  if (value && VALID_STATUS.has(value)) {
    return value as GapReportExecutionPayload["status"];
  }
  return "failed";
}

function normalizeStage(
  value: string | null,
): GapReportExecutionPayload["executionStage"] {
  if (!value) {
    return null;
  }

  return VALID_STAGE.has(value)
    ? (value as GapReportExecutionPayload["executionStage"])
    : null;
}

function extractFailureMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const gapAnalysis = value as Record<string, unknown>;
  const rawError = gapAnalysis.error;
  if (typeof rawError !== "string") {
    return null;
  }

  const trimmed = rawError.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getGapReportForUser(
  reportId: string,
  userId: string,
): Promise<GapReportExecutionPayload | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .select(
      "id, status, execution_stage, execution_progress, started_at, updated_at, completed_at, report_data, gap_analysis",
    )
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Gap report read query failed.", error, {
      report_id: reportId,
      user_id: userId,
    });
    throw new ReportReadQueryError(reportId, userId);
  }

  if (!data) {
    return null;
  }

  const status = normalizeStatus(data.status as string | null);
  const basePayload: Omit<GapReportExecutionPayload, "report" | "error"> = {
    id: data.id,
    status,
    executionStage: normalizeStage(data.execution_stage as string | null),
    executionProgress:
      typeof data.execution_progress === "number"
        ? data.execution_progress
        : null,
    startedAt:
      typeof data.started_at === "string" ? data.started_at : null,
    updatedAt:
      typeof data.updated_at === "string" ? data.updated_at : null,
    completedAt:
      typeof data.completed_at === "string" ? data.completed_at : null,
  };

  if (status === "queued" || status === "running" || status === "retrying") {
    return {
      ...basePayload,
      report: null,
      error: null,
    };
  }

  if (status === "failed") {
    return {
      ...basePayload,
      report: null,
      error:
        extractFailureMessage(data.gap_analysis) ?? "Report processing failed.",
    };
  }

  const canonical = parseStoredReportData(data.report_data);
  if (!canonical) {
    logger.error("Gap report completed without canonical report_data.", {
      report_id: reportId,
      user_id: userId,
    });
    return {
      ...basePayload,
      report: null,
      error: "Report data is unavailable.",
    };
  }

  return {
    ...basePayload,
    error: null,
    report: canonical,
  };
}
