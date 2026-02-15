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
import { clampScore } from "@/features/conversion-gap/services/reportAggregationScoring";

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

export function buildMessagingOverlap(input: {
  overlapSignals: string[];
  competitors: CompetitorInsight[];
  funnelRisk: number;
}): ConversionGapReport["messagingOverlap"] {
  const competitorNames = input.competitors
    .map((item) => item.name?.trim() ?? "")
    .filter((name) => name.length > 0);
  const names =
    competitorNames.length > 0
      ? competitorNames
      : input.overlapSignals.map((_, index) => `Competitor ${index + 1}`);

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

  return Object.fromEntries(
    resolvedKeys.map((key) => {
      const lower = key.toLowerCase();
      const hasDirect = responses.some((value) => value.includes(lower));
      const penalized = missing.has(lower);
      const base = hasDirect ? 78 : 42;
      const score = clampScore(base - (penalized ? 24 : 0));
      return [key, score];
    }),
  );
}
