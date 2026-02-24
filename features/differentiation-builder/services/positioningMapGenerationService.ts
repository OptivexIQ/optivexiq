import type { CompetitorInsight } from "@/features/conversion-gap/types/gap.types";
import type { DifferentiationBuilderOutput } from "@/features/differentiation-builder/services/differentiationBuilderService";
import type { CompetitiveMatrixOutput } from "@/features/differentiation-builder/services/competitiveMatrixService";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";

export type DifferentiationPositioningPoint = {
  name: string;
  x: number;
  y: number;
  isYou: boolean;
};

export type DifferentiationPositioningMap = {
  axes: {
    xLabel: string;
    yLabel: string;
  };
  points: DifferentiationPositioningPoint[];
  interpretation: string;
};

type PositioningMapGenerationInput = {
  companyName: string;
  profile: SaasProfileFormValues;
  competitors: CompetitorInsight[];
  positioning: DifferentiationBuilderOutput;
  matrix: CompetitiveMatrixOutput;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function mapBandToScore(value: string): number {
  const normalized = normalize(value);
  if (normalized === "high") {
    return 30;
  }
  if (normalized === "medium") {
    return 55;
  }
  return 75;
}

function getDimensionRow(matrix: CompetitiveMatrixOutput, dimension: string) {
  const normalizedDimension = normalize(dimension);
  return (
    matrix.rows.find((row) => normalize(row.dimension) === normalizedDimension) ??
    null
  );
}

function inferYourCostEfficiency(profile: SaasProfileFormValues): number {
  const pricing = normalize(profile.pricingModel);
  if (
    pricing.includes("usage") ||
    pricing.includes("free") ||
    pricing.includes("self-serve") ||
    pricing.includes("tiered")
  ) {
    return 72;
  }

  if (
    pricing.includes("enterprise") ||
    pricing.includes("contract") ||
    pricing.includes("custom")
  ) {
    return 38;
  }

  return 55;
}

function inferCompetitorCostEfficiency(summary: string): number {
  const text = normalize(summary);
  if (
    text.includes("enterprise") ||
    text.includes("premium") ||
    text.includes("contact sales")
  ) {
    return 35;
  }

  if (
    text.includes("affordable") ||
    text.includes("free") ||
    text.includes("startup") ||
    text.includes("self-serve")
  ) {
    return 72;
  }

  return 55;
}

function buildInterpretation(input: {
  companyName: string;
  similarityScore: number;
  highRiskParityZones: string[];
  underleveragedStrengths: string[];
}): string {
  const parityZone = input.highRiskParityZones[0];
  const underleveraged = input.underleveragedStrengths[0];

  const base =
    input.similarityScore >= 70
      ? `${input.companyName} is currently positioned in a higher-parity zone; shortlist substitution risk is elevated.`
      : `${input.companyName} shows moderate separation from core competitors with room to sharpen positioning clarity.`;

  const parityClause = parityZone
    ? ` Highest-risk parity area: ${parityZone}.`
    : "";

  const strengthClause = underleveraged
    ? ` Underleveraged strength to promote: ${underleveraged}.`
    : "";

  return `${base}${parityClause}${strengthClause}`.trim();
}

export function buildDifferentiationPositioningMap(
  input: PositioningMapGenerationInput,
): DifferentiationPositioningMap {
  const complexityRow = getDimensionRow(input.matrix, "Complexity");

  const yourComplexityBand = complexityRow?.you ?? "Medium";
  const yourSimplicityScore = clamp(100 - mapBandToScore(yourComplexityBand), 0, 100);
  const overlapPenalty = clamp(input.positioning.narrativeSimilarityScore * 0.18, 0, 20);
  const yourX = clamp(yourSimplicityScore - overlapPenalty, 0, 100);
  const yourY = inferYourCostEfficiency(input.profile);

  const competitorPoints: DifferentiationPositioningPoint[] = input.competitors.map(
    (competitor) => {
      const rowValue =
        complexityRow?.competitors.find(
          (item) => normalize(item.name) === normalize(competitor.name),
        )?.value ?? "Medium";

      const x = clamp(100 - mapBandToScore(rowValue), 0, 100);
      const y = inferCompetitorCostEfficiency(
        [
          competitor.summary ?? "",
          ...(competitor.positioning ?? []),
          ...(competitor.strengths ?? []),
        ].join(" "),
      );

      return {
        name: competitor.name,
        x,
        y,
        isYou: false,
      };
    },
  );

  return {
    axes: {
      xLabel: "Complexity -> Simplicity",
      yLabel: "Premium -> Cost-efficient",
    },
    points: [
      {
        name: input.companyName,
        x: yourX,
        y: yourY,
        isYou: true,
      },
      ...competitorPoints,
    ],
    interpretation: buildInterpretation({
      companyName: input.companyName,
      similarityScore: input.positioning.narrativeSimilarityScore,
      highRiskParityZones: input.positioning.highRiskParityZones,
      underleveragedStrengths: input.positioning.underleveragedStrengths,
    }),
  };
}

export function toCanonicalPositioningMapData(
  map: DifferentiationPositioningMap,
): PositioningMapData {
  return {
    axes: {
      xLabel: map.axes.xLabel,
      yLabel: map.axes.yLabel,
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    },
    points: map.points.map((point) => ({
      label: point.name,
      x: point.x,
      y: point.y,
      summary: point.isYou ? "Current company positioning" : "Competitor positioning estimate",
    })),
    insights: [map.interpretation],
  };
}
