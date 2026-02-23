import type { ConversionGapReport } from "@/features/reports/types/report.types";

type CompletenessResult = { ok: true } | { ok: false; reason: string };

function hasKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0;
}

function hasMeaningfulText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasMeaningfulCompetitiveMatrix(
  value: ConversionGapReport["competitiveMatrix"],
): boolean {
  const hasProfileRows = value.profileMatrix.some(
    (row) =>
      hasMeaningfulText(row.competitor) &&
      (hasMeaningfulText(row.ourAdvantage) || hasMeaningfulText(row.theirAdvantage)),
  );
  const hasCompetitorRows = value.competitorRows.some(
    (row) =>
      hasMeaningfulText(row.competitor) &&
      (hasMeaningfulText(row.summary) ||
        row.strengths.some(hasMeaningfulText) ||
        row.weaknesses.some(hasMeaningfulText) ||
        row.positioning.some(hasMeaningfulText)),
  );
  const hasDifferentiators = value.differentiators.some(
    (item) => hasMeaningfulText(item.claim) || hasMeaningfulText(item.proof),
  );
  const hasCounters = value.counters.some(
    (item) => hasMeaningfulText(item.competitor) || hasMeaningfulText(item.counter),
  );
  const hasNarrative =
    hasMeaningfulText(value.coreDifferentiationTension) ||
    hasMeaningfulText(value.substitutionRiskNarrative) ||
    hasMeaningfulText(value.counterPositioningVector) ||
    hasMeaningfulText(value.pricingDefenseNarrative);

  return (
    hasProfileRows ||
    hasCompetitorRows ||
    hasDifferentiators ||
    hasCounters ||
    hasNarrative
  );
}

function hasMeaningfulRewriteValues(value: Record<string, unknown>): boolean {
  const entries = Object.values(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.some((entry) => {
    if (entry === null || entry === undefined) {
      return false;
    }

    if (typeof entry === "string") {
      return entry.trim().length > 0;
    }

    if (typeof entry === "number") {
      return Number.isFinite(entry);
    }

    if (Array.isArray(entry)) {
      return entry.length > 0;
    }

    if (typeof entry === "object") {
      return Object.keys(entry as Record<string, unknown>).length > 0;
    }

    return false;
  });
}

export function assertCanonicalSectionCompleteness(
  report: ConversionGapReport,
): CompletenessResult {
  if (report.status !== "completed") {
    return { ok: true };
  }

  if (report.executiveNarrative.trim().length === 0) {
    return { ok: false, reason: "missing_executive_narrative" };
  }

  if (report.executiveSummary.trim().length === 0) {
    return { ok: false, reason: "missing_executive_summary" };
  }

  const diagnosis = report.diagnosis;
  const hasDiagnosis =
    diagnosis.summary.trim().length > 0 &&
    diagnosis.primaryGap.trim().length > 0 &&
    diagnosis.primaryRisk.trim().length > 0 &&
    diagnosis.primaryOpportunity.trim().length > 0;
  if (!hasDiagnosis) {
    return { ok: false, reason: "missing_diagnosis_section" };
  }

  const hasMessagingOverlap =
    (report.messagingOverlap.items.length > 0 ||
      report.messagingOverlap.insight.trim().length > 0) &&
    report.messagingOverlap.insight.trim().length > 0 &&
    report.messagingOverlap.ctaLabel.trim().length > 0;
  if (!hasMessagingOverlap) {
    return { ok: false, reason: "missing_messaging_overlap_section" };
  }

  if (!hasKeys(report.objectionCoverage)) {
    return { ok: false, reason: "missing_objection_coverage_section" };
  }

  if (!hasMeaningfulCompetitiveMatrix(report.competitiveMatrix)) {
    return { ok: false, reason: "missing_competitive_matrix_section" };
  }

  if (!hasKeys(report.positioningMap)) {
    return { ok: false, reason: "missing_positioning_map_section" };
  }

  if (!hasMeaningfulRewriteValues(report.rewrites)) {
    return { ok: false, reason: "missing_rewrites_section" };
  }

  if (report.rewriteRecommendations.length === 0) {
    return { ok: false, reason: "missing_rewrite_recommendations" };
  }

  const hasRevenueImpact =
    Number.isFinite(report.revenueImpact.pipelineAtRisk) &&
    Number.isFinite(report.revenueImpact.estimatedLiftPercent) &&
    Number.isFinite(report.revenueImpact.modeledWinRateDelta) &&
    Number.isFinite(report.revenueImpact.projectedPipelineRecovery);
  if (!hasRevenueImpact) {
    return { ok: false, reason: "missing_revenue_impact_section" };
  }

  return { ok: true };
}
