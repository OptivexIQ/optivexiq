import type { OverviewData, OverviewReport } from "@/data/dashboardOverview";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { getUsageSummary } from "@/features/usage/services/usageSummaryService";
import { parseStoredReportData } from "@/features/reports/services/reportService";
import { formatConversionGoalLabel } from "@/features/saas-profile/utils/conversionGoal";

type GapReportRow = {
  id: string;
  homepage_url: string | null;
  status: string | null;
  created_at: string | null;
  report_data: unknown;
  competitor_data: Record<string, unknown> | null;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .filter((item) => item.length > 0);
}

function deriveSite(url: string | null) {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function formatReportDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function mapStatus(status: string | null): OverviewReport["status"] {
  switch (status) {
    case "complete":
    case "completed":
      return "Complete";
    case "running":
      return "Running";
    case "queued":
      return "Queued";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

function deriveGapScore(reportData: unknown): number {
  const report = parseStoredReportData(reportData);
  if (!report) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(report.conversionScore)));
}

function deriveCompetitorCoverageCount(row: GapReportRow | null): number {
  if (!row) {
    return 0;
  }

  const fromCompetitorData = toStringArray(
    (row.competitor_data as Record<string, unknown> | null)?.competitor_urls,
  ).length;
  if (fromCompetitorData > 0) {
    return fromCompetitorData;
  }

  const report = parseStoredReportData(row.report_data);
  if (!report) {
    return 0;
  }

  const matrix = report.competitiveMatrix as Record<string, unknown> | null;
  const matrixRows = Array.isArray(matrix?.competitorRows)
    ? matrix.competitorRows.length
    : 0;
  if (matrixRows > 0) {
    return matrixRows;
  }

  const overlapItems = Array.isArray(report.messagingOverlap?.items)
    ? report.messagingOverlap.items.length
    : 0;
  return overlapItems;
}

function normalizeLimit(limit: number, fallback: number, used: number) {
  if (!Number.isFinite(limit)) {
    return Math.max(used, fallback, 1);
  }

  return Math.max(1, Math.round(limit));
}

function retentionCutoffIso(retentionDays: number) {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return null;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

const emptyOverview: OverviewData = {
  headline: "Your SaaS Conversion Overview",
  summary: {
    gapScore: 0,
    activeReports: 0,
    competitorCoverage: "0 of 0",
    conversionFocus: "N/A",
    usageUsed: 0,
    usageLimit: 1,
    usageUnlimited: false,
    hasSubscription: false,
  },
  reports: [],
  nextAction: {
    title: "Run your first report",
    description:
      "Generate a conversion report to unlock prioritized insights and fixes.",
  },
};

function buildNextAction(reportData: unknown) {
  const report = parseStoredReportData(reportData);
  if (!report) {
    return emptyOverview.nextAction;
  }

  const gap = report.priorityIssues[0]?.issue?.trim();
  if (gap) {
    return {
      title: "Priority gap detected",
      description: gap,
    };
  }

  const risk = report.executiveNarrative.trim();
  if (risk) {
    return {
      title: "Conversion risk detected",
      description: risk,
    };
  }

  return emptyOverview.nextAction;
}

export type DashboardOverviewResult =
  | { ok: true; data: OverviewData }
  | { ok: false; error: string };

async function fetchDashboardOverview(): Promise<DashboardOverviewResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return { ok: false, error: "Unauthorized" };
    }

    const settingsResult = await getUserSettings(authData.user.id);
    const retentionDays = settingsResult.ok
      ? settingsResult.settings.report_retention_days
      : 180;
    const retentionCutoff = retentionCutoffIso(retentionDays);

    let reportQuery = supabase
      .from("conversion_gap_reports")
      .select(
        "id, homepage_url, status, created_at, report_data, competitor_data",
      )
      .eq("user_id", authData.user.id)
      .eq("report_type", "full")
      .order("created_at", { ascending: false })
      .limit(12);

    if (retentionCutoff) {
      reportQuery = reportQuery.gte("created_at", retentionCutoff);
    }

    const { data: reports, error } = await reportQuery;

    if (error) {
      logger.error("Failed to load dashboard overview.", error);
      return { ok: false, error: "Unable to load dashboard overview." };
    }

    const rows = (reports ?? []) as GapReportRow[];
    const overviewReports: OverviewReport[] = rows.map((report) => ({
      id: report.id,
      site: deriveSite(report.homepage_url),
      score: deriveGapScore(report.report_data),
      status: mapStatus(report.status),
      date: formatReportDate(report.created_at),
    }));

    const latest = rows[0] ?? null;
    const latestWithCoverage = rows.find(
      (row) => deriveCompetitorCoverageCount(row) > 0,
    ) ?? latest;
    const competitorCoverageCount =
      deriveCompetitorCoverageCount(latestWithCoverage);

    const averageScore = overviewReports.length
      ? Math.round(
          overviewReports.reduce((sum, report) => sum + report.score, 0) /
            overviewReports.length,
        )
      : 0;

    const subscription = await getSubscription(authData.user.id);
    if (!subscription) {
      return { ok: false, error: "Subscription unavailable" };
    }
    const usageSummary = await getUsageSummary(authData.user.id, subscription);
    if (!usageSummary.ok) {
      return { ok: false, error: usageSummary.error };
    }

    const hasSubscription = usageSummary.data.lifecycle.is_entitled;
    const planLimit = hasSubscription
      ? usageSummary.data.limits.max_reports
      : 0;
    const usageUsed = Math.max(0, usageSummary.data.competitor_gaps_used ?? 0);
    const usageUnlimited = hasSubscription && planLimit === null;
    const usageLimit = hasSubscription
      ? planLimit === null
        ? Math.max(usageUsed, 1)
        : normalizeLimit(planLimit, 1, usageUsed)
      : 0;
    const coverageLimitLabel = hasSubscription
      ? planLimit === null
        ? "Unlimited"
        : String(planLimit)
      : "0";

    const { data: profileRow } = await supabase
      .from("saas_profiles")
      .select("conversion_goal, primary_conversion_goal")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    const conversionFocus = formatConversionGoalLabel(
      profileRow?.conversion_goal?.toString() ??
        profileRow?.primary_conversion_goal?.toString(),
      emptyOverview.summary.conversionFocus,
    );

    return {
      ok: true,
      data: {
        headline: emptyOverview.headline,
        summary: {
          gapScore: averageScore,
          activeReports: overviewReports.length,
          competitorCoverage: `${competitorCoverageCount} of ${coverageLimitLabel}`,
          conversionFocus,
          usageUsed,
          usageLimit,
          usageUnlimited,
          hasSubscription,
        },
        reports: overviewReports,
        nextAction: buildNextAction(latest?.report_data ?? null),
      },
    };
  } catch (error) {
    logger.error("Failed to build dashboard overview.", error);
    return { ok: false, error: "Unable to load dashboard overview." };
  }
}

export async function getDashboardOverviewResult(): Promise<DashboardOverviewResult> {
  return fetchDashboardOverview();
}

