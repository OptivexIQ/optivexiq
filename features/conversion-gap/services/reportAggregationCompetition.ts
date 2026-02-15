import type {
  CompetitiveCounterOutput,
  CompetitorInsight,
  DifferentiationOutput,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { CompetitorSynthesisOutput } from "@/features/conversion-gap/services/competitorSynthesisService";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";
import { clampScore } from "@/features/conversion-gap/services/reportAggregationScoring";

function normalizeCompetitorName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveOverlapByName(
  overlapByCompetitor: Map<
    string,
    {
      competitor: string;
      you: number;
      competitors: number;
    }
  >,
  competitorName: string,
) {
  const normalized = normalizeCompetitorName(competitorName);
  const exact = overlapByCompetitor.get(normalized);
  if (exact) {
    return exact;
  }

  for (const [key, value] of overlapByCompetitor.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  return null;
}

export function buildCompetitiveMatrix(input: {
  profile: SaasProfileFormValues;
  competitors: CompetitorInsight[];
  differentiation: DifferentiationOutput;
  counters: CompetitiveCounterOutput;
}) {
  const profileMatrix = input.profile.differentiationMatrix
    .filter(
      (item) =>
        item.competitor.trim().length > 0 ||
        item.ourAdvantage.trim().length > 0 ||
        item.theirAdvantage.trim().length > 0,
    )
    .map((item) => ({
      competitor: item.competitor.trim(),
      ourAdvantage: item.ourAdvantage.trim(),
      theirAdvantage: item.theirAdvantage.trim(),
    }));

  const competitorRows = input.competitors.map((item) => ({
    competitor: item.name,
    summary: item.summary ?? "",
    strengths: item.strengths ?? [],
    weaknesses: item.weaknesses ?? [],
    positioning: item.positioning ?? [],
  }));

  return {
    profileMatrix,
    competitorRows,
    differentiators: input.differentiation.differentiators,
    counters: input.counters.counters,
  };
}

export function buildCompetitiveMatrixFromSynthesis(
  synthesis: CompetitorSynthesisOutput,
  baseMatrix: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...baseMatrix,
    coreDifferentiationTension: synthesis.coreDifferentiationTension,
    substitutionRiskNarrative: synthesis.substitutionRiskNarrative,
    counterPositioningVector: synthesis.counterPositioningVector,
    pricingDefenseNarrative: synthesis.pricingDefenseNarrative,
  };
}

export function buildPositioningMap(input: {
  company: string;
  competitors: CompetitorInsight[];
  gapAnalysis: GapAnalysisOutput;
  differentiationScore: number;
  clarityScore: number;
  messagingOverlap: Array<{
    competitor: string;
    you: number;
    competitors: number;
  }>;
}): PositioningMapData {
  const overlapByCompetitor = new Map(
    input.messagingOverlap.map((item) => [
      normalizeCompetitorName(item.competitor),
      item,
    ]),
  );
  const overlapYouAverage =
    input.messagingOverlap.length > 0
      ? input.messagingOverlap.reduce((sum, item) => sum + item.you, 0) /
        input.messagingOverlap.length
      : null;
  const baseX = clampScore(overlapYouAverage ?? input.clarityScore);
  const baseY = clampScore(input.differentiationScore);

  const competitorPoints = input.competitors.map((item, index) => {
    const overlap = resolveOverlapByName(overlapByCompetitor, item.name);
    const x = clampScore(overlap?.competitors ?? 55);
    const overlapGap = Math.max(0, x - baseX);
    const offset = (index % 4) * 3;
    const y = clampScore(
      Math.max(
        15,
        78 -
          overlapGap * 0.35 -
          input.gapAnalysis.differentiationGaps.length * 5 -
          offset,
      ),
    );
    return {
      label: item.name,
      x,
      y,
      summary: item.summary ?? "",
    };
  });

  return {
    axes: {
      xLabel: "Messaging clarity",
      yLabel: "Differentiation strength",
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    },
    points: [
      {
        label: input.company,
        x: baseX,
        y: baseY,
        summary: "Current positioning baseline",
      },
      ...competitorPoints,
    ],
    insights: [
      ...input.gapAnalysis.opportunities.slice(0, 2),
      ...input.gapAnalysis.risks.slice(0, 2),
    ],
  };
}
