import type { ConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";

export function extractObjectionCoverageScores(
  value: ConversionGapReport["objectionCoverage"],
): Record<string, number> {
  return { ...(value.dimensionScores ?? {}) };
}

export function extractObjectionCoverageScore(
  value: ConversionGapReport["objectionCoverage"],
): number {
  return value.score;
}
