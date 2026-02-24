import { conversionGapReportSchema } from "@/features/conversion-gap/validators/reportSchema";
import type {
  ConversionGapReport,
  ReportFetchResult,
} from "@/features/reports/types/report.types";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { getUserSettings } from "@/features/settings/services/userSettingsService";

type GapReportRow = {
  id: string;
  user_id: string;
  created_at: string | null;
  report_data: unknown;
};

type GapReportExecutionRow = GapReportRow & {
  status: string | null;
  execution_stage: string | null;
  execution_progress: number | null;
  started_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  gap_analysis: unknown;
};

type ReportExecutionFetchResult =
  | {
      status: "ok";
      execution: GapReportExecutionPayload;
      rawReportData: unknown | null;
    }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "error"; message: string };

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

export function parseStoredReportData(
  value: unknown,
): ConversionGapReport | null {
  return validateGapReport(value);
}

export function validateGapReport(value: unknown): ConversionGapReport | null {
  const parsed = conversionGapReportSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function isReportExpired(createdAt: string | null, retentionDays: number) {
  if (!createdAt || !Number.isFinite(retentionDays) || retentionDays <= 0) {
    return false;
  }

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return false;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return created < cutoff;
}

function normalizeStatus(
  value: string | null,
): GapReportExecutionPayload["status"] {
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
  const rawError = (value as Record<string, unknown>).error;
  if (typeof rawError !== "string") {
    return null;
  }
  const trimmed = rawError.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function secondsSince(iso: string | null): number {
  if (!iso) {
    return Number.POSITIVE_INFINITY;
  }
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, Math.floor((Date.now() - value) / 1000));
}

function dispatchReportWorker(reason: string) {
  void import("@/features/reports/services/reportJobQueueService")
    .then((module) => module.runReportJobWorker(1))
    .catch((error) => {
      logger.error("report.worker_dispatch_failed", error, { reason });
    });
}

async function resolveRetentionDays(userId: string): Promise<number> {
  const settingsResult = await getUserSettings(userId);
  if (!settingsResult.ok) {
    throw new Error("settings_unavailable");
  }
  return settingsResult.settings.report_retention_days;
}

export async function getCanonicalGapReportForUser(
  reportId: string,
  userId: string,
): Promise<ReportFetchResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select("id, user_id, created_at, report_data")
      .eq("id", reportId)
      .eq("report_type", "full")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch canonical gap report.", error, {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Unable to fetch report." };
    }

    if (!data) {
      return { status: "not-found" };
    }

    const row = data as GapReportRow;
    if (row.user_id !== userId) {
      return { status: "forbidden" };
    }

    const settingsResult = await getUserSettings(userId);
    if (!settingsResult.ok) {
      logger.error("Failed to load user settings for canonical report read.", {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Settings unavailable." };
    }
    const retentionDays = settingsResult.settings.report_retention_days;

    if (isReportExpired(row.created_at, retentionDays)) {
      return { status: "not-found" };
    }

    if (!row.report_data || typeof row.report_data !== "object") {
      logger.error("Gap report missing canonical report_data.", {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Report data missing." };
    }

    const report = parseStoredReportData(row.report_data);
    if (!report) {
      logger.error("Gap report report_data failed schema validation.", {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Report data invalid." };
    }

    return {
      status: "ok",
      report,
    };
  } catch (error) {
    logger.error("Failed to fetch canonical gap report.", error, {
      report_id: reportId,
      user_id: userId,
    });
    return { status: "error", message: "Unable to fetch report." };
  }
}

export async function getCanonicalGapReportExecutionForUser(
  reportId: string,
  userId: string,
): Promise<ReportExecutionFetchResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select(
        "id, user_id, created_at, status, execution_stage, execution_progress, started_at, updated_at, completed_at, report_data, gap_analysis",
      )
      .eq("id", reportId)
      .eq("report_type", "full")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch canonical report execution state.", error, {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Unable to load report state." };
    }

    if (!data) {
      return { status: "not-found" };
    }

    const row = data as GapReportExecutionRow;
    if (row.user_id !== userId) {
      return { status: "forbidden" };
    }

    const retentionDays = await resolveRetentionDays(userId);
    if (isReportExpired(row.created_at, retentionDays)) {
      return { status: "not-found" };
    }

    const status = normalizeStatus(row.status);
    const baseExecution: Omit<GapReportExecutionPayload, "report" | "error"> = {
      id: row.id,
      status,
      executionStage: normalizeStage(row.execution_stage),
      executionProgress:
        typeof row.execution_progress === "number" ? row.execution_progress : null,
      startedAt: typeof row.started_at === "string" ? row.started_at : null,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
      completedAt: typeof row.completed_at === "string" ? row.completed_at : null,
    };

    if (status === "queued" || status === "running" || status === "retrying") {
      if (secondsSince(baseExecution.updatedAt) >= 15) {
        dispatchReportWorker("status_probe_stale_report_execution");
      }
      return {
        status: "ok",
        rawReportData: null,
        execution: {
          ...baseExecution,
          report: null,
          error: null,
        },
      };
    }

    if (status === "failed") {
      return {
        status: "ok",
        rawReportData: null,
        execution: {
          ...baseExecution,
          report: null,
          error: extractFailureMessage(row.gap_analysis) ?? "Report processing failed.",
        },
      };
    }

    if (!row.report_data || typeof row.report_data !== "object") {
      logger.error("Gap report missing canonical report_data.", {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Report data missing." };
    }

    const canonical = parseStoredReportData(row.report_data);
    if (!canonical) {
      logger.error("Gap report report_data failed schema validation.", {
        report_id: reportId,
        user_id: userId,
      });
      return { status: "error", message: "Report data invalid." };
    }

    return {
      status: "ok",
      rawReportData: row.report_data,
      execution: {
        ...baseExecution,
        error: null,
        report: canonical,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch canonical report execution state.", error, {
      report_id: reportId,
      user_id: userId,
    });
    return { status: "error", message: "Unable to load report state." };
  }
}
