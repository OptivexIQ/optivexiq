import {
  conversionGapReportSchema,
} from "@/features/conversion-gap/validators/reportSchema";
import type {
  ConversionGapReport,
  ReportFetchResult,
} from "@/features/reports/types/report.types";
import { logger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { calculateScore } from "@/features/conversion-gap/services/scoringModelService";

type GapReportRow = {
  id: string;
  user_id: string;
  created_at: string | null;
  report_data: unknown;
};

export function parseStoredReportData(
  value: unknown,
): ConversionGapReport | null {
  return validateGapReport(value);
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

function maxThreatLevel(
  a: ConversionGapReport["threatLevel"],
  b: ConversionGapReport["threatLevel"],
): ConversionGapReport["threatLevel"] {
  const rank: Record<ConversionGapReport["threatLevel"], number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return rank[a] >= rank[b] ? a : b;
}

async function fetchGapReport(reportId: string): Promise<ReportFetchResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { status: "forbidden" };
    }

    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select(
        "id, user_id, created_at, report_data",
      )
      .eq("id", reportId)
      .eq("report_type", "full")
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch gap report.", error);
      return { status: "error", message: "Unable to fetch report." };
    }

    if (!data) {
      return { status: "not-found" };
    }

    const row = data as GapReportRow;
    if (row.user_id && row.user_id !== authData.user.id) {
      return { status: "forbidden" };
    }

    const settingsResult = await getUserSettings(authData.user.id);
    const retentionDays = settingsResult.ok
      ? settingsResult.settings.report_retention_days
      : 180;

    if (isReportExpired(row.created_at, retentionDays)) {
      return { status: "not-found" };
    }

    if (!row.report_data || typeof row.report_data !== "object") {
      logger.error("Gap report missing canonical report_data.", {
        report_id: reportId,
        user_id: authData.user.id,
      });
      return { status: "error", message: "Report data missing." };
    }

    const report = parseStoredReportData(row.report_data);
    if (!report) {
      logger.error("Gap report report_data failed schema validation.", {
        report_id: reportId,
        user_id: authData.user.id,
      });
      return { status: "error", message: "Report data invalid." };
    }

    const modeled = calculateScore(report);
    const threatLevel = maxThreatLevel(
      modeled.revenueRiskLevel,
      modeled.competitiveThreatLevel,
    );

    return {
      status: "ok",
      report: {
        ...report,
        conversionScore: modeled.gapScore,
        threatLevel,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch gap report.", error);
    return { status: "error", message: "Unable to fetch report." };
  }
}

export async function getGapReport(
  _reportId: string,
): Promise<ReportFetchResult> {
  return fetchGapReport(_reportId);
}

export function validateGapReport(value: unknown): ConversionGapReport | null {
  const parsed = conversionGapReportSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
