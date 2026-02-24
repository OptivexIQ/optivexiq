import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { ModuleUsage } from "@/features/conversion-gap/services/moduleRuntimeService";
import {
  runCompetitiveInsightsSynthesisModule,
  type CompetitiveInsightsSynthesisOutput,
} from "@/features/differentiation-builder/ai/competitiveInsightsSynthesisModule";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export type ImplementationDifficulty = "low" | "medium" | "high";
export type ExpectedImpact = "low" | "medium" | "high";

export type DifferentiationOpportunity = {
  theme: string;
  rationale: string;
  implementationDifficulty: ImplementationDifficulty;
  expectedImpact: ExpectedImpact;
};

export type DifferentiationBuilderInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
};

export type DifferentiationBuilderOutput = {
  narrativeSimilarityScore: number;
  overlapAreas: string[];
  uniqueStrengthSignals: string[];
  underleveragedStrengths: string[];
  strategicNarrativeDifferences: Array<{
    difference: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  underservedPositioningTerritories: Array<{
    territory: string;
    rationale: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  credibleDifferentiationAxes: Array<{
    axis: string;
    rationale: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  marketPerceptionRisks: Array<{
    risk: string;
    whyItMatters: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  recommendedPositioningDirection: {
    direction: string;
    rationale: string;
    supportingEvidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  };
  differentiationOpportunities: DifferentiationOpportunity[];
  positioningStrategyRecommendations: string[];
  highRiskParityZones: string[];
  enterpriseDifferentiators: string[];
  competitiveInsights: CompetitiveInsightsSynthesisOutput["competitiveInsights"];
};

export async function runDifferentiationBuilder(
  input: DifferentiationBuilderInput,
): Promise<{ data: DifferentiationBuilderOutput; usage: ModuleUsage }> {
  const synthesized = await runCompetitiveInsightsSynthesisModule(input);
  return {
    data: {
      narrativeSimilarityScore: synthesized.data.narrativeSimilarityScore,
      overlapAreas: synthesized.data.overlapAreas,
      uniqueStrengthSignals: synthesized.data.uniqueStrengthSignals,
      underleveragedStrengths: synthesized.data.underleveragedStrengths,
      strategicNarrativeDifferences: synthesized.data.strategicNarrativeDifferences,
      underservedPositioningTerritories:
        synthesized.data.underservedPositioningTerritories,
      credibleDifferentiationAxes: synthesized.data.credibleDifferentiationAxes,
      marketPerceptionRisks: synthesized.data.marketPerceptionRisks,
      recommendedPositioningDirection:
        synthesized.data.recommendedPositioningDirection,
      differentiationOpportunities: synthesized.data.differentiationOpportunities,
      positioningStrategyRecommendations:
        synthesized.data.positioningStrategyRecommendations,
      highRiskParityZones: synthesized.data.highRiskParityZones,
      enterpriseDifferentiators: synthesized.data.enterpriseDifferentiators,
      competitiveInsights: synthesized.data.competitiveInsights,
    },
    usage: synthesized.usage,
  };
}
