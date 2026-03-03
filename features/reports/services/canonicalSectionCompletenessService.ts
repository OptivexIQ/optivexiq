import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { CANONICAL_REPORT_SCHEMA_VERSION } from "@/features/reports/contracts/canonicalReportContract";

type CompletenessResult = { ok: true } | { ok: false; reason: string };

function hasKeys(value: Record<string, unknown>): boolean {
  return Object.keys(value).length > 0;
}

function hasMeaningfulText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasEvidenceBoundConclusions(
  value: ConversionGapReport["diagnosticEvidence"][keyof ConversionGapReport["diagnosticEvidence"]],
): boolean {
  if (value.length === 0) {
    return false;
  }
  return value.every(
    (item) =>
      hasMeaningfulText(item.claim) &&
      item.evidence.length > 0 &&
      item.evidence.every(hasMeaningfulText) &&
      item.derivedFrom.length > 0 &&
      item.derivedFrom.every(hasMeaningfulText) &&
      Number.isFinite(item.confidenceScore) &&
      item.confidenceScore >= 0 &&
      item.confidenceScore <= 100,
  );
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

function hasMeaningfulObjectionCoverage(
  value: ConversionGapReport["objectionCoverage"],
): boolean {
  return (
    value.identified.length > 0 ||
    value.missing.length > 0 ||
    value.risks.length > 0 ||
    value.guidance.length > 0
  );
}

function hasMeaningfulDifferentiationInsights(
  value: ConversionGapReport["differentiationInsights"],
): boolean {
  return (
    value.overlapAreas.length > 0 ||
    value.opportunities.length > 0 ||
    value.strategyRecommendations.length > 0 ||
    value.parityRisks.length > 0
  );
}

function hasMeaningfulCompetitiveInsights(
  value: ConversionGapReport["competitiveInsights"],
): boolean {
  if (value.length === 0) {
    return false;
  }

  return value.some(
    (item) =>
      hasMeaningfulText(item.claim) &&
      hasMeaningfulText(item.reasoning) &&
      Number.isFinite(item.confidence) &&
      item.confidence >= 0 &&
      item.confidence <= 1 &&
      item.evidence.some(
        (evidence) =>
          hasMeaningfulText(evidence.competitor) &&
          hasMeaningfulText(evidence.snippet),
      ),
  );
}

function hasCompetitiveSectionMetadata(
  value: ConversionGapReport["competitive_section"],
): boolean {
  const hasValidStatus =
    value.status === "ready" || value.status === "insufficient_signal";
  const hasValidCounts =
    Number.isFinite(value.evidence_count) &&
    value.evidence_count >= 0 &&
    Number.isFinite(value.signal_density_score) &&
    value.signal_density_score >= 0 &&
    value.signal_density_score <= 100 &&
    Number.isFinite(value.extraction_confidence) &&
    value.extraction_confidence >= 0 &&
    value.extraction_confidence <= 100;

  if (!hasValidStatus || !hasValidCounts) {
    return false;
  }

  if (value.status === "insufficient_signal") {
    return (
      value.reason_code !== null &&
      value.evidence_count === 0 &&
      value.evidence.length === 0
    );
  }

  return value.evidence_count > 0;
}

function hasMeaningfulCompetitorSynthesis(
  value: ConversionGapReport["competitor_synthesis"],
): boolean {
  const whiteSpaceValid = (value.whiteSpaceOpportunities ?? []).every(
    (item) =>
      hasMeaningfulText(item.claim) &&
      item.missingAcross >= 2 &&
      item.evidence.length > 0 &&
      item.evidence.every(hasMeaningfulText),
  );

  return (
    hasMeaningfulText(value.coreDifferentiationTension) &&
    hasMeaningfulText(value.messagingOverlapRisk.explanation) &&
    hasMeaningfulText(value.substitutionRiskNarrative) &&
    hasMeaningfulText(value.counterPositioningVector) &&
    hasMeaningfulText(value.pricingDefenseNarrative) &&
    hasMeaningfulText(value.taxonomyVersion) &&
    !!value.companyTaxonomy &&
    Array.isArray(value.competitorTaxonomies) &&
    value.competitorTaxonomies.length > 0 &&
    Array.isArray(value.overlapByCompetitor) &&
    value.overlapByCompetitor.length > 0 &&
    !!value.dimensionalOverlap &&
    whiteSpaceValid
  );
}

export function assertCanonicalSectionCompleteness(
  report: ConversionGapReport,
): CompletenessResult {
  if (report.status !== "completed") {
    return { ok: true };
  }

  if (report.canonicalSchemaVersion !== CANONICAL_REPORT_SCHEMA_VERSION) {
    return { ok: false, reason: "invalid_canonical_schema_version" };
  }

  if (
    !hasMeaningfulText(report.riskModelVersion) ||
    !hasMeaningfulText(report.taxonomyVersion) ||
    !hasMeaningfulText(report.scoringWeightsVersion)
  ) {
    return { ok: false, reason: "missing_model_version_metadata" };
  }

  if (
    !report.reproducibilityChecksum ||
    !report.sectionHashes ||
    !report.evidenceProvenance
  ) {
    return { ok: false, reason: "missing_reproducibility_or_provenance" };
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
    report.messagingOverlap.items.length > 0 &&
    report.messagingOverlap.insight.trim().length > 0 &&
    report.messagingOverlap.ctaLabel.trim().length > 0;
  if (!hasMessagingOverlap) {
    return { ok: false, reason: "missing_messaging_overlap_section" };
  }

  if (!hasMeaningfulObjectionCoverage(report.objectionCoverage)) {
    return { ok: false, reason: "missing_objection_coverage_section" };
  }

  if (!hasMeaningfulDifferentiationInsights(report.differentiationInsights)) {
    return { ok: false, reason: "missing_differentiation_insights_section" };
  }

  if (!hasCompetitiveSectionMetadata(report.competitive_section)) {
    return { ok: false, reason: "invalid_competitive_section_metadata" };
  }

  if (
    report.competitive_section.status === "ready" &&
    !hasMeaningfulCompetitiveInsights(report.competitiveInsights)
  ) {
    return { ok: false, reason: "missing_competitive_insights_section" };
  }

  const hasSectionConfidence =
    Number.isFinite(report.sectionConfidence.positioning) &&
    Number.isFinite(report.sectionConfidence.objections) &&
    Number.isFinite(report.sectionConfidence.differentiation) &&
    Number.isFinite(report.sectionConfidence.scoring) &&
    Number.isFinite(report.sectionConfidence.narrative);
  if (!hasSectionConfidence) {
    return { ok: false, reason: "missing_section_confidence" };
  }

  const evidence = report.diagnosticEvidence;
  const hasDiagnosticEvidence =
    hasEvidenceBoundConclusions(evidence.positioningClarity) &&
    hasEvidenceBoundConclusions(evidence.objectionCoverage) &&
    hasEvidenceBoundConclusions(evidence.competitiveOverlap) &&
    hasEvidenceBoundConclusions(evidence.riskPrioritization) &&
    hasEvidenceBoundConclusions(evidence.narrativeDiagnosis);
  if (!hasDiagnosticEvidence) {
    return { ok: false, reason: "missing_diagnostic_evidence" };
  }

  if (
    report.competitive_section.status === "ready" &&
    !hasMeaningfulCompetitorSynthesis(report.competitor_synthesis)
  ) {
    return { ok: false, reason: "missing_competitor_synthesis_section" };
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
