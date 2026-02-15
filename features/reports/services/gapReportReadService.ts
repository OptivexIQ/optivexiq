import { createSupabaseServerClient } from "@/services/supabase/server";
import { parseStoredReportData } from "@/features/reports/services/reportService";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";

const VALID_STATUS = new Set(["queued", "running", "completed", "failed"]);
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

export async function getGapReportForUser(
  reportId: string,
  userId: string,
): Promise<GapReportExecutionPayload | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .select(
      "id, status, execution_stage, execution_progress, started_at, completed_at, report_data",
    )
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const canonical = parseStoredReportData(data.report_data) ?? null;

  return {
    id: data.id,
    status: normalizeStatus(data.status as string | null),
    executionStage: normalizeStage(data.execution_stage as string | null),
    executionProgress:
      typeof data.execution_progress === "number"
        ? data.execution_progress
        : null,
    startedAt:
      typeof data.started_at === "string" ? data.started_at : null,
    completedAt:
      typeof data.completed_at === "string" ? data.completed_at : null,
    report: canonical,
  };
}
