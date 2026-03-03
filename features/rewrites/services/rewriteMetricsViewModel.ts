import type { RewriteHypothesis } from "@/features/rewrites/types/rewrites.types";

export type DeterministicRewriteMetrics = {
  shiftStats: {
    clarityShift: string;
    objectionShift: string;
    positioningShift: "Strong" | "Moderate" | "Weak" | "Improving" | "Needs Work";
  } | null;
  confidence: string | null;
};

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function clamp01(value: number) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function similarityTarget(level: RewriteHypothesis["minimumDeltaLevel"]) {
  if (level === "strong") {
    return 0.55;
  }
  if (level === "moderate") {
    return 0.7;
  }
  return 0.85;
}

function toSignedPercent(value: number) {
  const rounded = Math.round(value);
  if (rounded > 0) {
    return `+${rounded}%`;
  }
  if (rounded < 0) {
    return `${rounded}%`;
  }
  return "0%";
}

export function buildDeterministicRewriteMetrics(params: {
  deltaMetrics: Record<string, unknown> | null | undefined;
  hypothesis: RewriteHypothesis | null | undefined;
}): DeterministicRewriteMetrics {
  const similarity = asFiniteNumber(params.deltaMetrics?.lexical_similarity);
  if (similarity == null) {
    return { shiftStats: null, confidence: null };
  }

  const boundedSimilarity = clamp01(similarity);
  const variation = 1 - boundedSimilarity;
  const target = similarityTarget(
    params.hypothesis?.minimumDeltaLevel ?? "moderate",
  );
  const headlineChanged = asBoolean(params.deltaMetrics?.headline_changed) ?? false;
  const ctaChanged = asBoolean(params.deltaMetrics?.cta_changed) ?? false;
  const structureChanged = asBoolean(params.deltaMetrics?.structure_changed) ?? false;
  const changedSignals = [headlineChanged, ctaChanged, structureChanged].filter(Boolean)
    .length;
  const signalScore = changedSignals / 3;
  const targetDeltaGap = target - boundedSimilarity;

  const clarityShift = toSignedPercent(variation * 100);
  const objectionShift = toSignedPercent((targetDeltaGap * 100) + signalScore * 12);

  let positioningShift: "Strong" | "Moderate" | "Weak" | "Improving" | "Needs Work" =
    "Needs Work";
  if (variation >= 0.45 || (headlineChanged && ctaChanged && structureChanged)) {
    positioningShift = "Strong";
  } else if (variation >= 0.3 || changedSignals >= 2) {
    positioningShift = "Moderate";
  } else if (variation >= 0.2 || changedSignals === 1) {
    positioningShift = "Improving";
  } else if (variation >= 0.1) {
    positioningShift = "Weak";
  }

  const targetCompliance = clamp01((targetDeltaGap + 0.15) / 0.15);
  const confidenceScore = clamp01(
    targetCompliance * 0.5 + signalScore * 0.3 + variation * 0.2,
  );
  const confidence = `${Math.round(confidenceScore * 100)}%`;

  return {
    shiftStats: {
      clarityShift,
      objectionShift,
      positioningShift,
    },
    confidence,
  };
}
