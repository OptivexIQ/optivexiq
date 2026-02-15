import { createSupabaseServerClient } from "@/services/supabase/server";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { isHttpError } from "@/lib/api/httpClient";
import {
  deriveCompetitorUrls,
  estimateCostCents,
  runGapEngine,
  scrapeAndExtract,
  type GapEngineResults,
  type UsageSummary,
} from "@/features/conversion-gap/services/gapEngineService";
import { buildConversionGapReport } from "@/features/conversion-gap/services/reportAggregationService";
import { logger } from "@/lib/logger";
import { getActiveSubscription } from "@/features/billing/services/planValidationService";
import { getOnboardingState } from "@/features/saas-profile/services/profileService";
import { analyzeCompetitors } from "@/features/conversion-gap/services/competitorAnalysisService";
import {
  completeGapReportAndCharge,
  completeSnapshotReportAndCharge,
  finalizeGenerateUsage,
  reserveGapReportQuota,
  reserveGenerateUsage,
  rollbackGapReportQuotaReservation,
  rollbackGenerateUsage,
} from "@/features/usage/services/usageTracker";
import { logUsageEvent } from "@/features/usage/services/usageEvents";
import {
  sendOverlapWarning,
  sendReportCompletionAlert,
} from "@/features/settings/services/notificationService";
import { markOnboardingComplete } from "@/features/saas-profile/services/profileService";
import type {
  GapAnalysisOutput,
  GapReportStatus,
  HeroOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SnapshotResult } from "@/features/conversion-gap/types/snapshot.types";
import { defaultSaasProfileValues } from "@/features/saas-profile/types/profile.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import { validateGapReport } from "@/features/reports/services/reportService";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

export type ReportCreatePayload = {
  homepage_url: string;
  pricing_url?: string | null;
  competitor_urls?: string[] | null;
  idempotencyKey?: string;
};

type ReportStatus = "queued" | "running" | "completed" | "failed";
type ReportType = "full" | "snapshot";
type ExecutionStage =
  | "queued"
  | "scraping_homepage"
  | "scraping_pricing"
  | "scraping_competitors"
  | "gap_analysis"
  | "competitor_synthesis"
  | "scoring"
  | "rewrite_generation"
  | "finalizing"
  | "complete"
  | "failed";
type InsertQueuedReportInput = {
  userId: string;
  reportType: ReportType;
  homepageUrl: string;
  pricingUrl: string | null;
  competitorData: Record<string, unknown>;
  isPartial: boolean;
  idempotencyKey: string | null;
};
type InsertQueuedReportResult =
  | { ok: true; reportId: string; status: ReportStatus; created: boolean }
  | { ok: false; status: number; error: string };

export type ReportCreateResult =
  | { ok: true; reportId: string; status: ReportStatus }
  | { ok: false; status: number; error: string };

type RecentReportResult = { id: string; status: ReportStatus } | null;

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "Unknown error";
  }

  if (isHttpError(error)) {
    const parts = [
      typeof error.status === "number" ? String(error.status) : null,
      typeof error.code === "string" ? error.code : null,
      typeof error.message === "string" ? error.message : null,
    ].filter((value): value is string => Boolean(value && value.length > 0));
    return parts.length > 0 ? parts.join(":") : "Unknown error";
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Unknown error";
}

function normalizeIdempotencyKey(value?: string): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function findRecentReport(
  userId: string,
  payload: ReportCreatePayload,
  reportType: ReportType,
): Promise<RecentReportResult> {
  const supabase = await createSupabaseServerClient();
  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);

  if (idempotencyKey) {
    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .select("id, status, created_at")
      .eq("user_id", userId)
      .eq("report_type", reportType)
      .eq("idempotency_key", idempotencyKey)
      .order("created_at", { ascending: false })
      .maybeSingle();
    if (!error && data?.id) {
      return { id: data.id, status: data.status as ReportStatus };
    }
  }

  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  let query = supabase
    .from("conversion_gap_reports")
    .select("id, status, created_at")
    .eq("user_id", userId)
    .eq("report_type", reportType)
    .eq("homepage_url", payload.homepage_url)
    .gte("created_at", since)
    .in("status", ["queued", "running"]);

  if (payload.pricing_url) {
    query = query.eq("pricing_url", payload.pricing_url);
  } else {
    query = query.is("pricing_url", null);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error || !data) {
    return null;
  }

  return data.id ? { id: data.id, status: data.status as ReportStatus } : null;
}

async function insertQueuedReport(
  input: InsertQueuedReportInput,
): Promise<InsertQueuedReportResult> {
  const supabase = await createSupabaseServerClient();
  const insertPayload = {
    user_id: input.userId,
    homepage_url: input.homepageUrl,
    pricing_url: input.pricingUrl,
    competitor_data: input.competitorData,
    report_type: input.reportType,
    is_partial: input.isPartial,
    status: "queued",
    idempotency_key: input.idempotencyKey,
    execution_stage: "queued",
    execution_progress: 0,
    started_at: null,
    completed_at: null,
  };

  if (input.idempotencyKey) {
    const { data, error } = await supabase
      .from("conversion_gap_reports")
      .insert(insertPayload)
      .select("id, status")
      .maybeSingle();

    if (error && error.code !== "23505") {
      return { ok: false, status: 500, error: "Unable to create report." };
    }

    if (data?.id) {
      return {
        ok: true,
        reportId: data.id,
        status: normalizeReportStatus(
          (data.status as string | null) ?? "queued",
        ),
        created: true,
      };
    }

    const { data: existing, error: existingError } = await supabase
      .from("conversion_gap_reports")
      .select("id, status")
      .eq("user_id", input.userId)
      .eq("report_type", input.reportType)
      .eq("idempotency_key", input.idempotencyKey)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingError || !existing?.id) {
      return { ok: false, status: 500, error: "Unable to create report." };
    }

    return {
      ok: true,
      reportId: existing.id,
      status: normalizeReportStatus(existing.status as string | null),
      created: false,
    };
  }

  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .insert(insertPayload)
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    return { ok: false, status: 500, error: "Unable to create report." };
  }

  return { ok: true, reportId: data.id, status: "queued", created: true };
}

async function findLatestSnapshot(userId: string): Promise<RecentReportResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversion_gap_reports")
    .select("id, status, created_at")
    .eq("user_id", userId)
    .eq("report_type", "snapshot")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.id ? { id: data.id, status: data.status as ReportStatus } : null;
}

async function fetchReportStatus(reportId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("conversion_gap_reports")
    .select("status")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.status as string | null;
}

async function markReportFailedIfPending(
  reportId: string,
  message: string,
): Promise<void> {
  const admin = createSupabaseAdminClient();
  const failedReportData = buildFailedReportData(reportId, message);
  await admin
    .from("conversion_gap_reports")
    .update({
      status: "failed",
      execution_stage: "failed",
      execution_progress: 100,
      completed_at: new Date().toISOString(),
      gap_analysis: { error: message },
      report_data: failedReportData,
    })
    .eq("id", reportId)
    .in("status", ["queued", "running"]);
}

function normalizeReportStatus(value: string | null): ReportStatus {
  if (
    value === "queued" ||
    value === "running" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }

  return "failed";
}

const RUNNING_REPORT_STALE_MS = 15 * 60 * 1000;
const SNAPSHOT_TOKEN_RESERVE = 12_000;
const GAP_TOKEN_RESERVE = 80_000;

function deriveCompanyName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function deriveSegment(profile: SaasProfileFormValues): string {
  const icpRole = profile.icpRole.trim();
  if (icpRole.length > 0) {
    return icpRole;
  }

  const revenueStage = profile.revenueStage.trim();
  if (revenueStage.length > 0) {
    return revenueStage;
  }

  return "SaaS";
}

function buildFailedReportData(
  reportId: string,
  message: string,
): Record<string, unknown> {
  const now = new Date().toISOString();
  const safeMessage = message.trim() || "Report generation failed.";
  const failedReport: ConversionGapReport = {
    id: reportId,
    company: "Unknown",
    segment: "SaaS",
    status: "failed",
    createdAt: now,
    conversionScore: 0,
    funnelRisk: 0,
    winRateDelta: 0,
    pipelineAtRisk: 0,
    differentiationScore: 0,
    pricingScore: 0,
    clarityScore: 0,
    confidenceScore: 0,
    threatLevel: "low",
    executiveNarrative: safeMessage,
    executiveSummary: safeMessage,
    messagingOverlap: {
      items: [],
      insight: "",
      ctaLabel: "",
    },
    objectionCoverage: {},
    competitiveMatrix: {},
    positioningMap: {},
    rewrites: {},
    rewriteRecommendations: [],
    revenueImpact: {
      pipelineAtRisk: 0,
      estimatedLiftPercent: 0,
      modeledWinRateDelta: 0,
      projectedPipelineRecovery: 0,
    },
    revenueProjection: {
      estimatedLiftPercent: 0,
      modeledWinRateDelta: 0,
      projectedPipelineRecovery: 0,
    },
    priorityIssues: [],
    priorityIndex: [],
  };

  return buildReportDataEnvelope(
    failedReport,
    { error: safeMessage },
    {},
    null,
  );
}

function buildReportDataEnvelope(
  report: ConversionGapReport,
  gapAnalysis: Record<string, unknown>,
  rewrites: Record<string, unknown>,
  competitorSynthesis: Record<string, unknown> | null,
): Record<string, unknown> {
  return {
    gap_analysis: gapAnalysis,
    rewrites,
    competitor_synthesis: competitorSynthesis,
    scores: {
      conversion_score: report.conversionScore,
      funnel_risk: report.funnelRisk,
      win_rate_delta: report.winRateDelta,
      pipeline_at_risk: report.pipelineAtRisk,
      differentiation_score: report.differentiationScore,
      pricing_score: report.pricingScore,
      clarity_score: report.clarityScore,
      confidence_score: report.confidenceScore,
      threat_level: report.threatLevel,
    },
    metadata: {
      report_id: report.id,
      company: report.company,
      segment: report.segment,
      created_at: report.createdAt,
      status: report.status,
      executive_narrative: report.executiveNarrative,
      executive_summary: report.executiveSummary,
      messaging_overlap: report.messagingOverlap,
      objection_coverage: report.objectionCoverage,
      competitive_matrix: report.competitiveMatrix,
      positioning_map: report.positioningMap,
      rewrite_recommendations: report.rewriteRecommendations,
      revenue_impact: report.revenueImpact,
      revenue_projection: report.revenueProjection,
      priority_issues: report.priorityIssues,
      priority_index: report.priorityIndex,
    },
  };
}

async function fetchProfileForUser(
  userId: string,
): Promise<SaasProfileFormValues | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("saas_profiles")
    .select(
      "icp_role, primary_pain, buying_trigger, website_url, acv_range, revenue_stage, sales_motion, conversion_goal, pricing_model, key_objections, proof_points, differentiation_matrix, onboarding_progress, onboarding_completed, updated_at, onboarding_completed_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    logger.error("Failed to load SaaS profile for report generation.", error, {
      user_id: userId,
    });
    return null;
  }

  return {
    icpRole: data.icp_role ?? "",
    primaryPain: data.primary_pain ?? "",
    buyingTrigger: data.buying_trigger ?? "",
    websiteUrl: data.website_url ?? "",
    acvRange: data.acv_range ?? "",
    revenueStage: data.revenue_stage ?? defaultSaasProfileValues.revenueStage,
    salesMotion: data.sales_motion ?? "",
    conversionGoal:
      data.conversion_goal ?? defaultSaasProfileValues.conversionGoal,
    pricingModel: data.pricing_model ?? "",
    keyObjections: Array.isArray(data.key_objections)
      ? data.key_objections.map((value: string) => ({ value }))
      : [{ value: "" }],
    proofPoints: Array.isArray(data.proof_points)
      ? data.proof_points.map((value: string) => ({ value }))
      : [{ value: "" }],
    differentiationMatrix: Array.isArray(data.differentiation_matrix)
      ? data.differentiation_matrix
      : defaultSaasProfileValues.differentiationMatrix,
    onboardingProgress: data.onboarding_progress ?? 0,
    onboardingCompleted: data.onboarding_completed ?? false,
    updatedAt: null,
    onboardingCompletedAt: null,
  };
}

async function updateReportStatus(
  reportId: string,
  status: GapReportStatus,
  payload?: Record<string, unknown>,
) {
  const admin = createSupabaseAdminClient();
  const updatePayload = { status, ...(payload ?? {}) };
  const { data, error } = await admin
    .from("conversion_gap_reports")
    .update(updatePayload)
    .eq("id", reportId)
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    logger.error("Failed to update gap report status", error, { report_id: reportId });
    throw new Error("Failed to persist report status.");
  }
}

async function updateExecutionState(
  reportId: string,
  stage: ExecutionStage,
  progress: number,
  payload?: Record<string, unknown>,
) {
  const admin = createSupabaseAdminClient();
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const { data, error } = await admin
    .from("conversion_gap_reports")
    .update({
      execution_stage: stage,
      execution_progress: normalizedProgress,
      ...(payload ?? {}),
    })
    .eq("id", reportId)
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    logger.error("Failed to persist execution stage.", error, {
      report_id: reportId,
      execution_stage: stage,
      execution_progress: normalizedProgress,
    });
    throw new Error("Failed to persist execution stage.");
  }
}

async function finalizeReservationWithFallback(params: {
  userId: string;
  reservationKey: string;
  actualTokens: number;
  actualCostCents: number;
  fallbackTokens: number;
  fallbackCostCents: number;
}): Promise<boolean> {
  const exact = await finalizeGenerateUsage({
    userId: params.userId,
    reservationKey: params.reservationKey,
    actualTokens: params.actualTokens,
    actualCostCents: params.actualCostCents,
  });
  if (exact.ok) {
    return true;
  }

  logger.error("Exact usage finalization failed; falling back to reservation.", {
    user_id: params.userId,
    reservation_key: params.reservationKey,
    error: exact.error,
  });

  const fallback = await finalizeGenerateUsage({
    userId: params.userId,
    reservationKey: params.reservationKey,
    actualTokens: params.fallbackTokens,
    actualCostCents: params.fallbackCostCents,
  });

  if (!fallback.ok) {
    logger.error("Fallback usage finalization failed.", {
      user_id: params.userId,
      reservation_key: params.reservationKey,
      error: fallback.error,
    });
    return false;
  }

  return true;
}

async function claimQueuedReport(
  reportId: string,
  userId: string,
): Promise<{ shouldProcess: boolean; status: GapReportStatus }> {
  const admin = createSupabaseAdminClient();
  const claimQueued = async () =>
    admin
      .from("conversion_gap_reports")
      .update({
        status: "running",
        execution_stage: "scraping_homepage",
        execution_progress: 5,
        started_at: new Date().toISOString(),
        completed_at: null,
      })
      .eq("id", reportId)
      .eq("user_id", userId)
      .eq("status", "queued")
      .select("status")
      .maybeSingle();

  const { data: claimed, error: claimError } = await claimQueued();
  if (claimError) {
    logger.error("Failed to claim queued report.", claimError, {
      report_id: reportId,
      user_id: userId,
    });
    throw new Error("Unable to claim queued report.");
  }

  if (claimed) {
    return { shouldProcess: true, status: "running" };
  }

  const { data: existing, error: existingError } = await admin
    .from("conversion_gap_reports")
    .select("status, quota_charged, created_at")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error("Report not found.");
  }

  const status = (existing.status ?? "failed") as GapReportStatus;
  const createdAtMs = existing.created_at
    ? new Date(existing.created_at).getTime()
    : Number.NaN;
  const isStaleRunning =
    status === "running" &&
    !existing.quota_charged &&
    Number.isFinite(createdAtMs) &&
    Date.now() - createdAtMs > RUNNING_REPORT_STALE_MS;

  if (isStaleRunning) {
    const { data: reclaimed, error: reclaimError } = await admin
      .from("conversion_gap_reports")
      .update({
        status: "queued",
        execution_stage: "queued",
        execution_progress: 0,
        started_at: null,
        completed_at: null,
      })
      .eq("id", reportId)
      .eq("user_id", userId)
      .eq("status", "running")
      .eq("quota_charged", false)
      .select("id")
      .maybeSingle();

    if (reclaimError) {
      logger.error("Failed to reclaim stale running report.", reclaimError, {
        report_id: reportId,
        user_id: userId,
      });
      return { shouldProcess: false, status };
    }

    if (reclaimed?.id) {
      const { data: reclaimedClaim, error: reclaimedClaimError } =
        await claimQueued();
      if (reclaimedClaimError) {
        logger.error(
          "Failed to claim reclaimed stale report.",
          reclaimedClaimError,
          { report_id: reportId, user_id: userId },
        );
        return { shouldProcess: false, status: "queued" };
      }
      if (reclaimedClaim) {
        return { shouldProcess: true, status: "running" };
      }
    }
  }

  return { shouldProcess: false, status };
}

function buildSnapshotResult(
  gapAnalysis: GapAnalysisOutput,
  hero: HeroOutput,
): SnapshotResult {
  const weaknesses = [
    ...gapAnalysis.gaps,
    ...gapAnalysis.risks,
    ...gapAnalysis.pricingClarityIssues,
    ...gapAnalysis.differentiationGaps,
  ]
    .map((item) => item?.trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);

  return {
    weaknesses,
    hero,
    uncoveredObjection: gapAnalysis.missingObjections[0] ?? "",
  };
}

async function processSnapshotReport(
  reportId: string,
  userId: string,
): Promise<GapReportStatus> {
  const claim = await claimQueuedReport(reportId, userId);
  if (!claim.shouldProcess) {
    return claim.status;
  }

  const reservationKey = `snapshot:${reportId}`;
  const reservedCostCents = estimateCostCents(0, SNAPSHOT_TOKEN_RESERVE);
  let tokenReserved = false;
  let completionCommitted = false;

  try {
    const admin = createSupabaseAdminClient();
    const { data: report, error } = await admin
      .from("conversion_gap_reports")
      .select("homepage_url")
      .eq("id", reportId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !report) {
      throw new Error("Snapshot report not found.");
    }

    const reservedUsage = await reserveGenerateUsage({
      userId,
      reservationKey,
      reservedTokens: SNAPSHOT_TOKEN_RESERVE,
      reservedCostCents,
    });
    if (!reservedUsage.ok) {
      throw new Error(reservedUsage.error ?? "token_quota_exceeded");
    }
    tokenReserved = true;

    const profile = await fetchProfileForUser(userId);
    if (!profile) {
      throw new Error("profile_missing");
    }
    const companyContent = await scrapeAndExtract(report.homepage_url);
    await updateExecutionState(reportId, "gap_analysis", 50);
    const { results, usage } = await runGapEngine({
      profile,
      companyContent,
      pricingContent: null,
      competitors: [],
    });
    await updateExecutionState(reportId, "finalizing", 92);

    const snapshotResult = buildSnapshotResult(results.gapAnalysis, results.hero);
    const usageResult = await completeSnapshotReportAndCharge({
      userId,
      reportId,
      snapshotResult,
      tokens: 0,
      costCents: 0,
    });
    if (!usageResult.ok) {
      throw new Error(
        usageResult.error ?? "Unable to persist snapshot completion.",
      );
    }
    completionCommitted = true;
    await updateExecutionState(reportId, "complete", 100, {
      completed_at: new Date().toISOString(),
    });

    const finalizedReservation = await finalizeReservationWithFallback({
      userId,
      reservationKey,
      actualTokens: usage.totalTokens,
      actualCostCents: usage.costCents,
      fallbackTokens: SNAPSHOT_TOKEN_RESERVE,
      fallbackCostCents: reservedCostCents,
    });
    if (!finalizedReservation) {
      throw new Error("Unable to finalize snapshot reservation.");
    }

    await logUsageEvent({
      user_id: userId,
      action: "snapshot",
      tokens_input: usage.inputTokens,
      tokens_output: usage.outputTokens,
      tokens_total: usage.totalTokens,
      cost_cents: usage.costCents,
      metadata: { report_id: reportId },
    });

    await markOnboardingComplete(userId);
    return "completed";
  } catch (error) {
    const message = extractErrorMessage(error);
    if (tokenReserved && !completionCommitted) {
      await rollbackGenerateUsage({ userId, reservationKey });
    }
    if (completionCommitted) {
      logger.error("Snapshot post-completion tasks failed.", error, {
        report_id: reportId,
        user_id: userId,
      });
      return "completed";
    }
    try {
      await updateReportStatus(reportId, "failed", {
        execution_stage: "failed",
        execution_progress: 100,
        completed_at: new Date().toISOString(),
        snapshot_result: { error: message },
      });
    } catch (statusError) {
      logger.error("Snapshot failure state persistence failed", statusError, {
        report_id: reportId,
        user_id: userId,
      });
      throw statusError;
    }
    logger.error("Snapshot processing failed", error);
    return "failed";
  }
}

async function processGapReport(
  reportId: string,
  userId: string,
): Promise<GapReportStatus> {
  const claim = await claimQueuedReport(reportId, userId);
  if (!claim.shouldProcess) {
    return claim.status;
  }

  const reservationKey = `gap:${reportId}`;
  const tokenReservationKey = `gap-tokens:${reportId}`;
  const gapReservedCostCents = estimateCostCents(0, GAP_TOKEN_RESERVE);
  let gapQuotaReserved = false;
  let tokenReserved = false;
  let completionCommitted = false;

  try {
    const admin = createSupabaseAdminClient();
    const { data: report, error } = await admin
      .from("conversion_gap_reports")
      .select("homepage_url, pricing_url, competitor_data")
      .eq("id", reportId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !report) {
      throw new Error("Gap report not found.");
    }

    const reservedQuota = await reserveGapReportQuota({
      userId,
      reportId,
      reservationKey,
    });
    if (!reservedQuota.ok) {
      throw new Error(reservedQuota.error ?? "competitor_gap_quota_exceeded");
    }
    gapQuotaReserved = true;

    const reservedTokens = await reserveGenerateUsage({
      userId,
      reservationKey: tokenReservationKey,
      reservedTokens: GAP_TOKEN_RESERVE,
      reservedCostCents: gapReservedCostCents,
    });
    if (!reservedTokens.ok) {
      throw new Error(reservedTokens.error ?? "token_quota_exceeded");
    }
    tokenReserved = true;

    const competitorUrls = deriveCompetitorUrls(
      (report.competitor_data as Record<string, unknown> | null)?.competitor_urls,
    );

    const profile = await fetchProfileForUser(userId);
    if (!profile) {
      throw new Error("profile_missing");
    }
    await updateExecutionState(reportId, "scraping_homepage", 12);
    const companyContent = await scrapeAndExtract(report.homepage_url);
    await updateExecutionState(
      reportId,
      report.pricing_url ? "scraping_pricing" : "scraping_competitors",
      report.pricing_url ? 24 : 34,
    );
    const pricingContent = report.pricing_url
      ? await scrapeAndExtract(report.pricing_url)
      : null;
    await updateExecutionState(reportId, "scraping_competitors", 34);
    const competitorScrapeResults = await Promise.all(
      competitorUrls.map(async (url) => {
        try {
          const content = await scrapeAndExtract(url);
          return { url, content, error: null as unknown };
        } catch (error) {
          return { url, content: null, error };
        }
      }),
    );
    const competitorContent = competitorScrapeResults
      .map((item) => item.content)
      .filter((item): item is NonNullable<typeof item> => item !== null);
    const failedCompetitorUrls = competitorScrapeResults
      .filter((item) => item.error !== null)
      .map((item) => item.url);
    if (failedCompetitorUrls.length > 0) {
      logger.error("One or more competitor scrapes failed.", {
        report_id: reportId,
        user_id: userId,
        failed_competitor_urls: failedCompetitorUrls,
        successful_competitor_count: competitorContent.length,
      });
    }
    const competitors = await analyzeCompetitors(competitorContent);

    await updateExecutionState(reportId, "gap_analysis", 55);
    const { results, usage } = await runGapEngine({
      profile,
      companyContent,
      pricingContent,
      competitors,
    });
    await updateExecutionState(reportId, "competitor_synthesis", 72);
    await updateExecutionState(reportId, "scoring", 82);
    await updateExecutionState(reportId, "rewrite_generation", 90);

    const canonicalReport = buildConversionGapReport({
      reportId,
      company: deriveCompanyName(report.homepage_url),
      websiteUrl: report.homepage_url,
      segment: deriveSegment(profile),
      gapAnalysis: results.gapAnalysis,
      rewrites: {
        hero: results.hero,
        pricing: results.pricing,
        objections: results.objections,
        differentiation: results.differentiation,
        competitiveCounter: results.competitiveCounter,
      },
      competitorData: {
        homepage: companyContent,
        pricing: pricingContent,
        competitors,
      },
      competitorSynthesis: results.competitorSynthesis,
      profile,
      status: "completed",
    });
    if (!validateGapReport(canonicalReport)) {
      throw new Error("invalid_report_data");
    }
    const reportDataEnvelope = buildReportDataEnvelope(
      canonicalReport,
      results.gapAnalysis as unknown as Record<string, unknown>,
      {
        hero: results.hero,
        pricing: results.pricing,
        objections: results.objections,
        differentiation: results.differentiation,
        competitiveCounter: results.competitiveCounter,
      } as unknown as Record<string, unknown>,
      results.competitorSynthesis as unknown as Record<string, unknown>,
    );

    const usageResult = await completeGapReportAndCharge({
      userId,
      reportId,
      reservationKey,
      reportData: reportDataEnvelope,
      competitorData: {
        homepage: companyContent,
        pricing: pricingContent,
        competitors,
      },
      tokens: 0,
      costCents: 0,
    });
    await updateExecutionState(reportId, "finalizing", 96);
    if (!usageResult.ok) {
      throw new Error(
        usageResult.error ?? "Unable to record gap report usage.",
      );
    }
    completionCommitted = true;

    const finalizedTokens = await finalizeReservationWithFallback({
      userId,
      reservationKey: tokenReservationKey,
      actualTokens: usage.totalTokens,
      actualCostCents: usage.costCents,
      fallbackTokens: GAP_TOKEN_RESERVE,
      fallbackCostCents: gapReservedCostCents,
    });
    if (!finalizedTokens) {
      throw new Error("Unable to finalize gap token reservation.");
    }
    await updateExecutionState(reportId, "complete", 100, {
      completed_at: new Date().toISOString(),
    });

    await logUsageEvent({
      user_id: userId,
      action: "gap_engine",
      tokens_input: usage.inputTokens,
      tokens_output: usage.outputTokens,
      tokens_total: usage.totalTokens,
      cost_cents: usage.costCents,
      metadata: { report_id: reportId },
    });

    const overlapCount = Array.isArray(results.gapAnalysis.messagingOverlap)
      ? results.gapAnalysis.messagingOverlap.length
      : 0;

    await sendReportCompletionAlert({ userId, reportId });
    await sendOverlapWarning({ userId, reportId, overlapCount });
    return "completed";
  } catch (error) {
    const message = extractErrorMessage(error);
    if (gapQuotaReserved && !completionCommitted) {
      await rollbackGapReportQuotaReservation({ userId, reservationKey });
    }
    if (tokenReserved && !completionCommitted) {
      await rollbackGenerateUsage({
        userId,
        reservationKey: tokenReservationKey,
      });
    }
    if (completionCommitted) {
      logger.error("Gap report post-completion tasks failed.", error, {
        report_id: reportId,
        user_id: userId,
      });
      return "completed";
    }
    try {
      await updateReportStatus(reportId, "failed", {
        execution_stage: "failed",
        execution_progress: 100,
        completed_at: new Date().toISOString(),
        gap_analysis: { error: message },
        report_data: buildFailedReportData(reportId, message),
      });
    } catch (statusError) {
      logger.error("Gap report failure state persistence failed", statusError, {
        report_id: reportId,
        user_id: userId,
      });
      throw statusError;
    }
    logger.error("Gap engine processing failed", error);
    return "failed";
  }
}

async function processQueuedReportIfNeeded(
  reportType: ReportType,
  reportId: string,
  userId: string,
  status: ReportStatus,
): Promise<ReportStatus> {
  if (status === "completed" || status === "failed") {
    return status;
  }

  try {
    if (reportType === "full") {
      await processGapReport(reportId, userId);
    } else {
      await processSnapshotReport(reportId, userId);
    }
  } catch (error) {
    logger.error("Failed to process queued report.", error, {
      report_id: reportId,
      user_id: userId,
      report_type: reportType,
    });
  }

  return normalizeReportStatus(await fetchReportStatus(reportId));
}

export async function createReportAndProcess(
  userId: string,
  payload: ReportCreatePayload,
): Promise<ReportCreateResult> {
  const onboardingState = await getOnboardingState(userId);
  if (!onboardingState?.onboardingCompleted) {
    return {
      ok: false,
      status: 403,
      error: "Complete onboarding to unlock full conversion reports.",
    };
  }

  const recentId = await findRecentReport(userId, payload, "full");
  if (recentId) {
    if (recentId.status === "queued" || recentId.status === "running") {
      void processQueuedReportIfNeeded("full", recentId.id, userId, recentId.status)
        .catch((error) => {
          logger.error("Background processing for reused gap report failed.", error, {
            report_id: recentId.id,
            user_id: userId,
          });
        });
    }
    logger.info("Reusing recent gap report.", {
      report_id: recentId.id,
      user_id: userId,
      status: recentId.status,
      idempotency_key: payload.idempotencyKey ?? null,
    });
    return { ok: true, reportId: recentId.id, status: recentId.status };
  }

  const competitorData: Record<string, unknown> = {
    competitor_urls: payload.competitor_urls ?? [],
  };
  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);
  if (idempotencyKey) {
    competitorData.idempotency_key = idempotencyKey;
  }

  const inserted = await insertQueuedReport({
    userId,
    reportType: "full",
    homepageUrl: payload.homepage_url,
    pricingUrl: payload.pricing_url ?? null,
    competitorData,
    isPartial: false,
    idempotencyKey,
  });
  if (!inserted.ok) {
    return inserted;
  }

  const reportId = inserted.reportId;
  if (!inserted.created) {
    if (inserted.status === "queued" || inserted.status === "running") {
      void processQueuedReportIfNeeded("full", reportId, userId, inserted.status)
        .catch((error) => {
          logger.error("Background processing for existing queued report failed.", error, {
            report_id: reportId,
            user_id: userId,
          });
        });
    }
    return { ok: true, reportId, status: inserted.status };
  }

  void (async () => {
    try {
      await processGapReport(reportId, userId);
    } catch (err) {
      logger.error("Failed to finalize gap report.", err, {
        report_id: reportId,
        user_id: userId,
      });
      const message = extractErrorMessage(err);
      await markReportFailedIfPending(reportId, message);
    }
  })();

  return { ok: true, reportId, status: inserted.status };
}

export async function createSnapshotAndProcess(
  userId: string,
  homepageUrl: string,
  idempotencyKey?: string,
): Promise<ReportCreateResult> {
  const subscription = await getActiveSubscription(userId);
  if (!subscription) {
    return {
      ok: false,
      status: 403,
      error: "Active subscription required.",
    };
  }

  if (subscription.plan === "starter") {
    const existing = await findLatestSnapshot(userId);
    if (existing && existing.status !== "failed") {
      const status = await processQueuedReportIfNeeded(
        "snapshot",
        existing.id,
        userId,
        existing.status,
      );
      return { ok: true, reportId: existing.id, status };
    }
  }

  const recentId = await findRecentReport(
    userId,
    { homepage_url: homepageUrl, idempotencyKey },
    "snapshot",
  );
  if (recentId && recentId.status !== "failed") {
    const status = await processQueuedReportIfNeeded(
      "snapshot",
      recentId.id,
      userId,
      recentId.status,
    );
    return { ok: true, reportId: recentId.id, status };
  }

  const competitorData: Record<string, unknown> = {
    competitor_urls: [],
  };
  const normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
  if (normalizedIdempotencyKey) {
    competitorData.idempotency_key = normalizedIdempotencyKey;
  }

  const inserted = await insertQueuedReport({
    userId,
    reportType: "snapshot",
    homepageUrl,
    pricingUrl: null,
    competitorData,
    isPartial: true,
    idempotencyKey: normalizedIdempotencyKey,
  });
  if (!inserted.ok) {
    return {
      ok: false,
      status: inserted.status,
      error: "Unable to create snapshot.",
    };
  }

  const reportId = inserted.reportId;
  if (!inserted.created) {
    const status = await processQueuedReportIfNeeded(
      "snapshot",
      reportId,
      userId,
      inserted.status,
    );
    return { ok: true, reportId, status };
  }

  try {
    await processSnapshotReport(reportId, userId);
  } catch (err) {
    logger.error("Failed to finalize snapshot report.", err, {
      report_id: reportId,
      user_id: userId,
    });
    const message = extractErrorMessage(err);
    await markReportFailedIfPending(reportId, message);
  }

  const status = normalizeReportStatus(await fetchReportStatus(reportId));
  return { ok: true, reportId, status };
}
