import type {
  CompetitorInsight,
  GapAnalysisOutput,
  ObjectionOutput,
} from "@/features/conversion-gap/types/gap.types";
import type {
  ConversionGapReport,
  ThreatLevel,
} from "@/features/conversion-gap/types/conversionGapReport.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { CompetitorSynthesisOutput } from "@/features/conversion-gap/services/competitorSynthesisService";
import type { CompetitiveMatrixOutput } from "@/features/differentiation-builder/services/competitiveMatrixService";
import { clampScore } from "@/features/conversion-gap/services/reportAggregationScoring";

function normalizeCompetitorName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveDistributionForCompetitor(
  distributions: Map<
    string,
    {
      low: number;
      moderate: number;
      high: number;
      dimensions: number;
    }
  >,
  competitorName: string,
):
  | {
      low: number;
      moderate: number;
      high: number;
      dimensions: number;
    }
  | undefined {
  const normalized = normalizeCompetitorName(competitorName);
  const exact = distributions.get(normalized);
  if (exact) {
    return exact;
  }

  for (const [key, value] of distributions.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  return undefined;
}

function mapMatrixValueToRank(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "low") {
    return 0;
  }
  if (normalized === "medium") {
    return 1;
  }
  if (normalized === "high") {
    return 2;
  }
  return null;
}

function buildOverlapDistributionByCompetitor(
  matrix?: CompetitiveMatrixOutput,
): Map<
  string,
  {
    low: number;
    moderate: number;
    high: number;
    dimensions: number;
  }
> {
  const output = new Map<
    string,
    {
      low: number;
      moderate: number;
      high: number;
      dimensions: number;
    }
  >();

  if (!matrix || matrix.rows.length === 0) {
    return output;
  }

  const counters = new Map<
    string,
    { low: number; moderate: number; high: number; dimensions: number }
  >();

  for (const row of matrix.rows) {
    const youRank = mapMatrixValueToRank(row.you);
    if (youRank === null) {
      continue;
    }

    for (const competitor of row.competitors) {
      const competitorRank = mapMatrixValueToRank(competitor.value);
      if (competitorRank === null) {
        continue;
      }

      const key = normalizeCompetitorName(competitor.name);
      const current = counters.get(key) ?? {
        low: 0,
        moderate: 0,
        high: 0,
        dimensions: 0,
      };

      const distance = Math.abs(youRank - competitorRank);
      if (distance === 0) {
        current.high += 1;
      } else if (distance === 1) {
        current.moderate += 1;
      } else {
        current.low += 1;
      }
      current.dimensions += 1;
      counters.set(key, current);
    }
  }

  for (const [key, value] of counters.entries()) {
    if (value.dimensions <= 0) {
      continue;
    }

    const total = value.dimensions;
    const toPercent = (count: number) => (count / total) * 100;
    const raw = {
      low: toPercent(value.low),
      moderate: toPercent(value.moderate),
      high: toPercent(value.high),
    };

    const floored = {
      low: Math.floor(raw.low),
      moderate: Math.floor(raw.moderate),
      high: Math.floor(raw.high),
    };
    const remainders = [
      { key: "low" as const, value: raw.low - floored.low },
      { key: "moderate" as const, value: raw.moderate - floored.moderate },
      { key: "high" as const, value: raw.high - floored.high },
    ].sort((a, b) => b.value - a.value);

    const normalized = { ...floored };
    let remaining = 100 - (floored.low + floored.moderate + floored.high);
    let cursor = 0;
    while (remaining > 0) {
      const target = remainders[cursor % remainders.length].key;
      normalized[target] += 1;
      remaining -= 1;
      cursor += 1;
    }

    output.set(key, {
      low: normalized.low,
      moderate: normalized.moderate,
      high: normalized.high,
      dimensions: value.dimensions,
    });
  }

  return output;
}

export function buildExecutiveNarrative(input: {
  company: string;
  segment: string;
  gapAnalysis: GapAnalysisOutput;
  scores: {
    conversionScore: number;
    funnelRisk: number;
  };
}): string {
  const topGap = input.gapAnalysis.gaps[0] ?? "";
  const topRisk = input.gapAnalysis.risks[0] ?? "";
  const topOpportunity = input.gapAnalysis.opportunities[0] ?? "";
  const headline = `${input.company} in ${input.segment} shows a conversion profile of ${input.scores.conversionScore}/100 with funnel risk at ${input.scores.funnelRisk}/100.`;
  const diagnosis = `Primary gap: ${topGap}. Primary risk: ${topRisk}.`;
  const opportunity = `Highest-leverage opportunity: ${topOpportunity}.`;
  return [headline, diagnosis, opportunity].join(" ");
}

export function buildDiagnosis(input: {
  gapAnalysis: GapAnalysisOutput;
  executiveNarrative: string;
}): ConversionGapReport["diagnosis"] {
  const primaryGap =
    input.gapAnalysis.gaps
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? "No primary gap identified.";
  const primaryRisk =
    input.gapAnalysis.risks
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? "No primary risk identified.";
  const primaryOpportunity =
    input.gapAnalysis.opportunities
      .map((item) => item.trim())
      .find((item) => item.length > 0) ?? "No primary opportunity identified.";
  const summary = input.executiveNarrative.trim();

  return {
    summary:
      summary.length > 0
        ? summary
        : `Primary gap: ${primaryGap}. Primary risk: ${primaryRisk}. Highest-leverage opportunity: ${primaryOpportunity}.`,
    primaryGap,
    primaryRisk,
    primaryOpportunity,
  };
}

export function buildMessagingOverlap(input: {
  overlapSignals: string[];
  competitors: CompetitorInsight[];
  funnelRisk: number;
  competitiveMatrixOverride?: CompetitiveMatrixOutput;
}): ConversionGapReport["messagingOverlap"] {
  const competitorNames = input.competitors
    .map((item) => item.name?.trim() ?? "")
    .filter((name) => name.length > 0);
  const names =
    competitorNames.length > 0
      ? competitorNames
      : input.overlapSignals.map((_, index) => `Competitor ${index + 1}`);

  const distributionByCompetitor = buildOverlapDistributionByCompetitor(
    input.competitiveMatrixOverride,
  );

  const items = names.map((competitor, index) => {
    const severity = clampScore(
      input.funnelRisk * 0.6 + input.overlapSignals.length * 8 + index * 3,
    );
    const risk: ThreatLevel =
      severity >= 70 ? "high" : severity >= 40 ? "medium" : "low";
    return {
      competitor,
      you: clampScore(100 - severity * 0.55),
      competitors: clampScore(55 + severity * 0.45),
      risk,
      overlapDistribution: resolveDistributionForCompetitor(
        distributionByCompetitor,
        competitor,
      ),
    };
  });

  const highRisk = items.filter((item) => item.risk === "high").length;
  const insight = `${highRisk} high-risk overlap signal${highRisk === 1 ? "" : "s"} detected across ${items.length} competitor message lane${items.length === 1 ? "" : "s"}.`;

  return {
    items,
    insight,
    ctaLabel:
      highRisk > 0 ? "Resolve high-overlap messaging" : "Refine messaging edge",
  };
}

export function buildMessagingOverlapFromSynthesis(
  input: {
    synthesis: CompetitorSynthesisOutput;
    competitors: CompetitorInsight[];
    overlapSignals: string[];
    competitiveMatrixOverride?: CompetitiveMatrixOutput;
  },
): ConversionGapReport["messagingOverlap"] {
  const { synthesis } = input;
  const risk: ThreatLevel =
    synthesis.messagingOverlapRisk.level === "high"
      ? "high"
      : synthesis.messagingOverlapRisk.level === "moderate"
        ? "medium"
        : "low";
  const baseScore = risk === "high" ? 80 : risk === "medium" ? 55 : 30;

  const competitorNames = input.competitors
    .map((item) => item.name?.trim() ?? "")
    .filter((name) => name.length > 0);
  const signalNames = input.overlapSignals
    .map((item) => item.trim())
    .filter((name) => name.length > 0);
  const names = competitorNames.length > 0 ? competitorNames : signalNames;

  const resolvedNames =
    names.length > 0 ? names : ["Competitor 1", "Competitor 2"];

  const distributionByCompetitor = buildOverlapDistributionByCompetitor(
    input.competitiveMatrixOverride,
  );

  const items = resolvedNames.map((competitor, index) => {
    const nameOffset =
      competitor
        .split("")
        .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9;
    const directionalOffset = nameOffset - 4 + index;
    const competitorScore = clampScore(baseScore + directionalOffset);
    const youScore = clampScore(100 - competitorScore + Math.floor(nameOffset / 2));
    const competitorRisk: ThreatLevel =
      competitorScore >= 70
        ? "high"
        : competitorScore >= 40
          ? "medium"
          : "low";

    return {
      competitor,
      you: youScore,
      competitors: competitorScore,
      risk: competitorRisk,
      overlapDistribution: resolveDistributionForCompetitor(
        distributionByCompetitor,
        competitor,
      ),
    };
  });

  return {
    items,
    insight: synthesis.messagingOverlapRisk.explanation,
    ctaLabel: "Reduce overlap risk",
  };
}

export function buildObjectionCoverage(input: {
  profile: SaasProfileFormValues;
  objections: ObjectionOutput;
  missingObjections: string[];
}) {
  const keys = input.profile.keyObjections
    .map((item) => item.value.trim())
    .filter((item) => item.length > 0);
  const resolvedKeys = keys.length > 0 ? keys : ["trust", "risk reduction", "roi"];
  const responses = input.objections.objections.map((item) =>
    `${item.objection} ${item.response}`.toLowerCase(),
  );
  const missing = new Set(input.missingObjections.map((item) => item.toLowerCase()));

  const dimensionScores = Object.fromEntries(
    resolvedKeys.map((key) => {
      const lower = key.toLowerCase();
      const hasDirect = responses.some((value) => value.includes(lower));
      const penalized = missing.has(lower);
      const base = hasDirect ? 78 : 42;
      const score = clampScore(base - (penalized ? 24 : 0));
      return [key, score];
    }),
  );

  const coverageValues = Object.values(dimensionScores);
  const score =
    coverageValues.length > 0
      ? clampScore(
          Math.round(
            coverageValues.reduce((sum, value) => sum + value, 0) /
              coverageValues.length,
          ),
        )
      : 0;

  const identified = input.objections.objections.map((item) => ({
    objection: item.objection,
    severity: "medium" as const,
    evidence: item.response,
  }));

  const missingItems = input.missingObjections.map((item) => ({
    objection: item,
    severity: "high" as const,
    impact:
      "This objection is currently under-addressed in decision-stage messaging.",
  }));

  const risks = missingItems.slice(0, 3).map((item) => item.objection);
  const guidance = input.objections.objections.map((item) => ({
    objection: item.objection,
    recommendedStrategy: item.response,
  }));

  return {
    score,
    identified,
    missing: missingItems,
    risks,
    guidance,
    dimensionScores,
  };
}
