import { runEmbeddings } from "@/features/ai/client/openaiClient";
import type { CompetitorInsight } from "@/features/conversion-gap/types/gap.types";
import type { DifferentiationBuilderOutput } from "@/features/differentiation-builder/services/differentiationBuilderService";
import type { CompetitiveMatrixOutput } from "@/features/differentiation-builder/services/competitiveMatrixService";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";

export const POSITIONING_MAP_GENERATION_VERSION = "embedding-pca-v1";

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
  generationVersion: string;
};

type PositioningMapGenerationInput = {
  companyName: string;
  profile: SaasProfileFormValues;
  competitors: CompetitorInsight[];
  positioning: DifferentiationBuilderOutput;
  matrix: CompetitiveMatrixOutput;
};

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length && i < b.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

function normalizeVector(v: number[]): number[] {
  const mag = magnitude(v);
  if (!Number.isFinite(mag) || mag <= 0) {
    return v.map(() => 0);
  }
  return v.map((value) => value / mag);
}

function buildEntityTexts(input: PositioningMapGenerationInput): Array<{
  name: string;
  text: string;
  isYou: boolean;
}> {
  const companyText = [
    input.profile.icpRole,
    input.profile.primaryPain,
    input.profile.buyingTrigger,
    input.profile.salesMotion,
    input.profile.conversionGoal,
    ...input.positioning.enterpriseDifferentiators,
    ...input.positioning.positioningStrategyRecommendations,
    ...input.positioning.uniqueStrengthSignals,
  ]
    .map(normalize)
    .filter((value) => value.length > 0)
    .join("\n");

  const competitorTexts = input.competitors.map((competitor) => ({
    name: competitor.name,
    isYou: false,
    text: [
      competitor.summary ?? "",
      ...(competitor.positioning ?? []),
      ...(competitor.strengths ?? []),
      ...(competitor.weaknesses ?? []),
      ...(competitor.extraction?.positioningClaims ?? []),
      ...(competitor.extraction?.coreValuePropositions ?? []),
      ...(competitor.extraction?.pricingSignals ?? []),
    ]
      .map(normalize)
      .filter((value) => value.length > 0)
      .join("\n"),
  }));

  return [
    {
      name: input.companyName,
      text: companyText,
      isYou: true,
    },
    ...competitorTexts.filter((item) => item.text.length > 0),
  ];
}

function centerVectors(vectors: number[][]): number[][] {
  if (vectors.length === 0) {
    return [];
  }
  const dims = vectors[0].length;
  const mean = new Array<number>(dims).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < dims; i += 1) {
      mean[i] += vector[i];
    }
  }
  for (let i = 0; i < dims; i += 1) {
    mean[i] /= vectors.length;
  }
  return vectors.map((vector) => vector.map((value, index) => value - mean[index]));
}

function multiplyCovariance(centered: number[][], vector: number[]): number[] {
  if (centered.length === 0) {
    return [];
  }
  const dims = centered[0].length;
  const out = new Array<number>(dims).fill(0);
  for (const row of centered) {
    const projection = dot(row, vector);
    for (let i = 0; i < dims; i += 1) {
      out[i] += row[i] * projection;
    }
  }
  const scale = 1 / Math.max(1, centered.length - 1);
  for (let i = 0; i < dims; i += 1) {
    out[i] *= scale;
  }
  return out;
}

function powerIteration(centered: number[][], seed: number): number[] {
  if (centered.length === 0) {
    return [];
  }
  const dims = centered[0].length;
  let vector = new Array<number>(dims).fill(0).map((_, index) => {
    const raw = Math.sin(seed * 1000 + index * 0.73) * 0.5 + 0.5;
    return raw;
  });
  vector = normalizeVector(vector);
  for (let iteration = 0; iteration < 32; iteration += 1) {
    vector = normalizeVector(multiplyCovariance(centered, vector));
  }
  return vector;
}

function deflate(centered: number[][], component: number[]): number[][] {
  return centered.map((row) => {
    const scalar = dot(row, component);
    return row.map((value, index) => value - scalar * component[index]);
  });
}

function projectToRange(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) {
    return values.map(() => 50);
  }
  return values.map((value) => clamp(((value - min) / span) * 100, 0, 100));
}

function buildInterpretation(input: PositioningMapGenerationInput): string {
  const parityZone = input.positioning.highRiskParityZones[0] ?? "none";
  const underleveraged = input.positioning.underleveragedStrengths[0] ?? "none";
  return `Map generated via embedding PCA projection (${POSITIONING_MAP_GENERATION_VERSION}); parity=${parityZone}; underleveraged_strength=${underleveraged}`;
}

export async function buildDifferentiationPositioningMap(
  input: PositioningMapGenerationInput,
): Promise<DifferentiationPositioningMap> {
  const entities = buildEntityTexts(input);
  if (entities.length === 0) {
    return {
      axes: {
        xLabel: "Positioning projection axis 1",
        yLabel: "Positioning projection axis 2",
      },
      points: [],
      interpretation: buildInterpretation(input),
      generationVersion: POSITIONING_MAP_GENERATION_VERSION,
    };
  }

  const embeddings = await runEmbeddings({
    model: "text-embedding-3-small",
    input: entities.map((entity) => entity.text),
  });
  const centered = centerVectors(embeddings.embeddings);
  if (centered.length === 0 || centered[0].length === 0) {
    return {
      axes: {
        xLabel: "Positioning projection axis 1",
        yLabel: "Positioning projection axis 2",
      },
      points: entities.map((entity) => ({
        name: entity.name,
        x: 50,
        y: 50,
        isYou: entity.isYou,
      })),
      interpretation: buildInterpretation(input),
      generationVersion: POSITIONING_MAP_GENERATION_VERSION,
    };
  }

  const component1 = powerIteration(centered, 1);
  const residual = deflate(centered, component1);
  const component2 = powerIteration(residual, 2);
  const xScores = projectToRange(centered.map((row) => dot(row, component1)));
  const yScores = projectToRange(centered.map((row) => dot(row, component2)));

  return {
    axes: {
      xLabel: "Positioning projection axis 1",
      yLabel: "Positioning projection axis 2",
    },
    points: entities.map((entity, index) => ({
      name: entity.name,
      x: xScores[index] ?? 50,
      y: yScores[index] ?? 50,
      isYou: entity.isYou,
    })),
    interpretation: buildInterpretation(input),
    generationVersion: POSITIONING_MAP_GENERATION_VERSION,
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
