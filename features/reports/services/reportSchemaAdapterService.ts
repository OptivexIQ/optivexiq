import { createHash } from "crypto";

export const CURRENT_REPORT_SCHEMA_VERSION = 2;
const LEGACY_TEXT_SENTINEL = "legacy_unavailable";

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toStringValue(value: unknown, fallback = LEGACY_TEXT_SENTINEL): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeStatus(value: unknown): "queued" | "running" | "completed" | "failed" {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    normalized === "queued" ||
    normalized === "running" ||
    normalized === "completed" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return "failed";
}

function ensureArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function hashPayload(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function buildDefaultSectionHashes(source: Record<string, unknown>): Record<string, string> {
  return {
    positioning: hashPayload(source.diagnosis ?? {}),
    objections: hashPayload(source.objectionCoverage ?? {}),
    differentiation: hashPayload(source.differentiationInsights ?? {}),
    scoring: hashPayload(source.scoringBreakdown ?? {}),
    narrative: hashPayload(source.executiveNarrative ?? ""),
  };
}

function buildDefaultEvidenceProvenance() {
  const fallbackHash = hashPayload("legacy_evidence");
  const base = {
    evidence_sources: [] as Array<{ url: string; snippet_hash: string }>,
    evidence_hash: fallbackHash,
    module_prompt_version: 1,
    model_name: "legacy_unknown",
    model_temperature: 0,
    token_count: 0,
  };
  return {
    positioningClarity: base,
    objectionCoverage: base,
    competitiveOverlap: base,
    riskPrioritization: base,
    narrativeDiagnosis: base,
  };
}

function adaptCompetitiveSection(data: Record<string, unknown>) {
  const existing = toObject(data.competitive_section);
  const competitorSynthesis = toObject(data.competitor_synthesis);
  const overlapByCompetitor = ensureArray(competitorSynthesis.overlapByCompetitor);
  const status = overlapByCompetitor.length > 0 ? "ready" : "insufficient_signal";
  return {
    status,
    reason_code:
      status === "ready" ? null : "insufficient_competitor_coverage",
    evidence: status === "ready" ? overlapByCompetitor.slice(0, 5).map((item) => JSON.stringify(item)) : [],
    evidence_count: status === "ready" ? overlapByCompetitor.length : 0,
    signal_density_score: toNumberValue(existing.signal_density_score, status === "ready" ? 50 : 0),
    extraction_confidence: toNumberValue(existing.extraction_confidence, status === "ready" ? 50 : 0),
  };
}

export function readReportSchemaVersion(
  reportData: unknown,
  reportSchemaVersionColumn: number | null | undefined,
): number {
  if (typeof reportSchemaVersionColumn === "number" && Number.isFinite(reportSchemaVersionColumn)) {
    return reportSchemaVersionColumn;
  }
  const data = toObject(reportData);
  return toNumberValue(data.reportSchemaVersion, 1);
}

export function adaptLegacyReportData(input: {
  reportData: unknown;
  reportId: string;
  createdAt: string | null;
}): unknown {
  const raw = toObject(input.reportData);
  const status = normalizeStatus(raw.status);
  const diagnosis = toObject(raw.diagnosis);
  const competitorSynthesis = toObject(raw.competitor_synthesis);
  const overlapByCompetitor = ensureArray(competitorSynthesis.overlapByCompetitor);
  const normalized = {
    ...raw,
    reportSchemaVersion: CURRENT_REPORT_SCHEMA_VERSION,
    legacyMigrated: true,
    id: toStringValue(raw.id, input.reportId),
    createdAt: toStringValue(raw.createdAt, input.createdAt ?? new Date().toISOString()),
    status,
    company: toStringValue(raw.company, "Unknown"),
    segment: toStringValue(raw.segment, "SaaS"),
    executiveNarrative: toStringValue(raw.executiveNarrative),
    executiveSummary: toStringValue(raw.executiveSummary),
    diagnosis: {
      summary: toStringValue(diagnosis.summary),
      primaryGap: toStringValue(diagnosis.primaryGap),
      primaryRisk: toStringValue(diagnosis.primaryRisk),
      primaryOpportunity: toStringValue(diagnosis.primaryOpportunity),
    },
    conversionScore: toNumberValue(raw.conversionScore, 0),
    funnelRisk: toNumberValue(raw.funnelRisk, 0),
    winRateDelta: toNumberValue(raw.winRateDelta, 0),
    pipelineAtRisk: toNumberValue(raw.pipelineAtRisk, 0),
    differentiationScore: toNumberValue(raw.differentiationScore, 0),
    pricingScore: toNumberValue(raw.pricingScore, 0),
    clarityScore: toNumberValue(raw.clarityScore, 0),
    confidenceScore: toNumberValue(raw.confidenceScore, 0),
    competitive_section: adaptCompetitiveSection(raw),
    competitor_synthesis: {
      ...competitorSynthesis,
      overlapDensity: toNumberValue(competitorSynthesis.overlapDensity, 0),
      referencedTaxonomyIds: Array.isArray(competitorSynthesis.referencedTaxonomyIds)
        ? competitorSynthesis.referencedTaxonomyIds
        : ["companyTaxonomy.valuePropositions", "companyTaxonomy.primaryClaims"],
      referencedOverlapDimensionIds: Array.isArray(
        competitorSynthesis.referencedOverlapDimensionIds,
      )
        ? competitorSynthesis.referencedOverlapDimensionIds
        : [
            "messaging_overlap",
            "positioning_overlap",
            "pricing_overlap",
            "aggregate_overlap",
          ],
      whiteSpaceRulesApplied: Array.isArray(competitorSynthesis.whiteSpaceRulesApplied)
        ? competitorSynthesis.whiteSpaceRulesApplied
        : ["legacy_adapted"],
      overlapByCompetitor,
    },
    sectionHashes:
      raw.sectionHashes && typeof raw.sectionHashes === "object"
        ? (raw.sectionHashes as Record<string, string>)
        : buildDefaultSectionHashes(raw),
    evidenceProvenance:
      raw.evidenceProvenance && typeof raw.evidenceProvenance === "object"
        ? raw.evidenceProvenance
        : buildDefaultEvidenceProvenance(),
    reproducibilityChecksum: toStringValue(
      raw.reproducibilityChecksum,
      hashPayload({
        id: input.reportId,
        createdAt: input.createdAt,
        status,
        conversionScore: raw.conversionScore,
        clarityScore: raw.clarityScore,
      }),
    ),
  };
  return normalized;
}
