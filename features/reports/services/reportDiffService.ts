import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { parseStoredReportData } from "@/features/reports/services/canonicalReportReadService";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { extractObjectionCoverageScores } from "@/features/conversion-gap/services/objectionCoverageService";

type ReportRow = {
  id: string;
  user_id: string;
  homepage_url: string | null;
  created_at: string | null;
  report_data: unknown;
};

type NumericDelta = {
  current: number;
  baseline: number;
  delta: number;
};

export type ReportDiffPayload = {
  reportId: string;
  baselineReportId: string;
  generatedAt: string;
  summary: {
    conversionScore: NumericDelta;
    funnelRisk: NumericDelta;
    differentiationScore: NumericDelta;
    estimatedLiftPercent: NumericDelta;
    pipelineAtRisk: NumericDelta;
  };
  diagnosis: {
    currentPrimaryGap: string;
    baselinePrimaryGap: string;
    changed: boolean;
  };
  messagingOverlap: {
    currentCount: number;
    baselineCount: number;
    deltaCount: number;
  };
  objectionCoverage: {
    improved: string[];
    declined: string[];
    unchanged: number;
  };
  competitiveMatrix: {
    competitorRows: NumericDelta;
    differentiators: NumericDelta;
    counters: NumericDelta;
  };
  rewriteRecommendations: {
    added: string[];
    removed: string[];
  };
};

export type ReportDiffResult =
  | { status: "ok"; payload: ReportDiffPayload }
  | { status: "not-found" }
  | { status: "forbidden" }
  | { status: "conflict"; message: string }
  | { status: "error"; message: string };

function retentionCutoffIso(retentionDays: number) {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return null;
  }
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

function toReport(value: unknown): ConversionGapReport | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return parseStoredReportData(value);
}

function toDelta(current: number, baseline: number): NumericDelta {
  return {
    current,
    baseline,
    delta: Math.round((current - baseline) * 100) / 100,
  };
}

function toNumberOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function diffObjectionCoverage(
  current: Record<string, number>,
  baseline: Record<string, number>,
) {
  const keys = new Set([...Object.keys(current), ...Object.keys(baseline)]);
  const improved: string[] = [];
  const declined: string[] = [];
  let unchanged = 0;

  for (const key of keys) {
    const currentValue = toNumberOrZero(current[key] ?? 0);
    const baselineValue = toNumberOrZero(baseline[key] ?? 0);
    if (currentValue > baselineValue) {
      improved.push(key);
      continue;
    }
    if (currentValue < baselineValue) {
      declined.push(key);
      continue;
    }
    unchanged += 1;
  }

  return { improved, declined, unchanged };
}

function diffRewriteRecommendations(
  current: ConversionGapReport,
  baseline: ConversionGapReport,
) {
  const currentSlugs = new Set(
    current.rewriteRecommendations
      .map((item) => item.slug.trim())
      .filter((value) => value.length > 0),
  );
  const baselineSlugs = new Set(
    baseline.rewriteRecommendations
      .map((item) => item.slug.trim())
      .filter((value) => value.length > 0),
  );

  const added = [...currentSlugs].filter((slug) => !baselineSlugs.has(slug));
  const removed = [...baselineSlugs].filter((slug) => !currentSlugs.has(slug));
  return { added, removed };
}

function buildDiffPayload(
  current: ConversionGapReport,
  baseline: ConversionGapReport,
): ReportDiffPayload {
  const currentObjectionCoverage = extractObjectionCoverageScores(
    current.objectionCoverage,
  );
  const baselineObjectionCoverage = extractObjectionCoverageScores(
    baseline.objectionCoverage,
  );

  return {
    reportId: current.id,
    baselineReportId: baseline.id,
    generatedAt: new Date().toISOString(),
    summary: {
      conversionScore: toDelta(current.conversionScore, baseline.conversionScore),
      funnelRisk: toDelta(current.funnelRisk, baseline.funnelRisk),
      differentiationScore: toDelta(
        current.differentiationScore,
        baseline.differentiationScore,
      ),
      estimatedLiftPercent: toDelta(
        current.revenueImpact.estimatedLiftPercent,
        baseline.revenueImpact.estimatedLiftPercent,
      ),
      pipelineAtRisk: toDelta(
        current.revenueImpact.pipelineAtRisk,
        baseline.revenueImpact.pipelineAtRisk,
      ),
    },
    diagnosis: {
      currentPrimaryGap: current.diagnosis.primaryGap,
      baselinePrimaryGap: baseline.diagnosis.primaryGap,
      changed:
        current.diagnosis.primaryGap.trim().toLowerCase() !==
        baseline.diagnosis.primaryGap.trim().toLowerCase(),
    },
    messagingOverlap: {
      currentCount: current.messagingOverlap.items.length,
      baselineCount: baseline.messagingOverlap.items.length,
      deltaCount:
        current.messagingOverlap.items.length - baseline.messagingOverlap.items.length,
    },
    objectionCoverage: diffObjectionCoverage(
      currentObjectionCoverage,
      baselineObjectionCoverage,
    ),
    competitiveMatrix: {
      competitorRows: toDelta(
        current.competitiveMatrix.competitorRows.length,
        baseline.competitiveMatrix.competitorRows.length,
      ),
      differentiators: toDelta(
        current.competitiveMatrix.differentiators.length,
        baseline.competitiveMatrix.differentiators.length,
      ),
      counters: toDelta(
        current.competitiveMatrix.counters.length,
        baseline.competitiveMatrix.counters.length,
      ),
    },
    rewriteRecommendations: diffRewriteRecommendations(current, baseline),
  };
}

async function findPreviousRow(input: {
  userId: string;
  reportId: string;
  createdAt: string | null;
  homepageUrl: string | null;
  retentionCutoff: string | null;
}): Promise<ReportRow | null> {
  const supabase = await createSupabaseServerClient();
  const select = "id, user_id, homepage_url, created_at, report_data";

  if (input.createdAt) {
    let byHomepage = supabase
      .from("conversion_gap_reports")
      .select(select)
      .eq("report_type", "full")
      .eq("user_id", input.userId)
      .lt("created_at", input.createdAt)
      .order("created_at", { ascending: false })
      .limit(1);
    if (input.homepageUrl) {
      byHomepage = byHomepage.eq("homepage_url", input.homepageUrl);
    }
    if (input.retentionCutoff) {
      byHomepage = byHomepage.gte("created_at", input.retentionCutoff);
    }
    const byHomepageResult = await byHomepage.maybeSingle();
    if (!byHomepageResult.error && byHomepageResult.data) {
      return byHomepageResult.data as ReportRow;
    }
  }
  return null;
}

export async function getReportDiffForUser(input: {
  reportId: string;
  userId: string;
  baselineReportId?: string | null;
}): Promise<ReportDiffResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const settingsResult = await getUserSettings(input.userId);
    const retentionDays = settingsResult.ok
      ? settingsResult.settings.report_retention_days
      : 180;
    const retentionCutoff = retentionCutoffIso(retentionDays);

    const currentResult = await supabase
      .from("conversion_gap_reports")
      .select("id, user_id, homepage_url, created_at, report_data")
      .eq("id", input.reportId)
      .eq("report_type", "full")
      .eq("user_id", input.userId)
      .maybeSingle();
    if (currentResult.error) {
      logger.error("Failed to fetch report for diff.", currentResult.error, {
        report_id: input.reportId,
        user_id: input.userId,
      });
      return { status: "error", message: "Unable to load report comparison." };
    }
    if (!currentResult.data) {
      return { status: "not-found" };
    }

    const currentRow = currentResult.data as ReportRow;
    if (currentRow.user_id !== input.userId) {
      return { status: "forbidden" };
    }

    const currentReport = toReport(currentRow.report_data);
    if (!currentReport) {
      return { status: "conflict", message: "Current report is not comparable." };
    }

    let baselineRow: ReportRow | null = null;
    if (input.baselineReportId) {
      let baselineQuery = supabase
        .from("conversion_gap_reports")
        .select("id, user_id, homepage_url, created_at, report_data")
        .eq("id", input.baselineReportId)
        .eq("report_type", "full")
        .eq("user_id", input.userId);
      if (retentionCutoff) {
        baselineQuery = baselineQuery.gte("created_at", retentionCutoff);
      }
      const baselineResult = await baselineQuery.maybeSingle();
      if (baselineResult.error) {
        logger.error("Failed to fetch baseline report for diff.", baselineResult.error, {
          report_id: input.reportId,
          baseline_report_id: input.baselineReportId,
          user_id: input.userId,
        });
        return { status: "error", message: "Unable to load report comparison." };
      }
      baselineRow = baselineResult.data ? (baselineResult.data as ReportRow) : null;
    } else {
      baselineRow = await findPreviousRow({
        userId: input.userId,
        reportId: input.reportId,
        createdAt: currentRow.created_at,
        homepageUrl: currentRow.homepage_url,
        retentionCutoff,
      });
    }

    if (!baselineRow) {
      return { status: "conflict", message: "No baseline report found for comparison." };
    }
    if (baselineRow.user_id !== input.userId) {
      return { status: "forbidden" };
    }

    const baselineReport = toReport(baselineRow.report_data);
    if (!baselineReport) {
      return { status: "conflict", message: "Baseline report is not comparable." };
    }

    return { status: "ok", payload: buildDiffPayload(currentReport, baselineReport) };
  } catch (error) {
    logger.error("Failed to compute report diff.", error, {
      report_id: input.reportId,
      baseline_report_id: input.baselineReportId ?? null,
      user_id: input.userId,
    });
    return { status: "error", message: "Unable to load report comparison." };
  }
}
