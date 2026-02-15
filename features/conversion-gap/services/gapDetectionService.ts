import type {
  CompetitorInsight,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";

export async function detectConversionGaps(
  _competitors: CompetitorInsight[],
): Promise<GapAnalysisOutput> {
  return {
    gaps: [],
    opportunities: [],
    risks: [],
    messagingOverlap: [],
    missingObjections: [],
    differentiationGaps: [],
    pricingClarityIssues: [],
  };
}
