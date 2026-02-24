import type {
  CompetitorInsight,
  GapAnalysisOutput,
  HeroOutput,
  PricingOutput,
  ObjectionOutput,
  DifferentiationOutput,
  CompetitiveCounterOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import type { ConversionGapReport } from "@/features/conversion-gap/types/conversionGapReport.types";
import type { CompetitorSynthesisOutput } from "@/features/conversion-gap/services/competitorSynthesisService";
import type { ObjectionAnalysisOutput } from "@/features/objection-engine/ai/objectionAnalysisModule";
import type { DifferentiationBuilderOutput } from "@/features/differentiation-builder/services/differentiationBuilderService";
import type { CompetitiveMatrixOutput } from "@/features/differentiation-builder/services/competitiveMatrixService";
import type { PositioningMapData } from "@/features/positioning-map/types/positioningMap.types";

export type GapRewrites = {
  hero: HeroOutput;
  pricing: PricingOutput;
  objections: ObjectionOutput;
  differentiation: DifferentiationOutput;
  competitiveCounter: CompetitiveCounterOutput;
};

export type BuildConversionGapReportInput = {
  reportId: string;
  company: string;
  websiteUrl: string;
  segment: string;
  gapAnalysis: GapAnalysisOutput;
  rewrites: GapRewrites;
  competitorData: {
    homepage?: unknown;
    pricing?: unknown;
    competitors?: CompetitorInsight[];
  };
  competitorSynthesis?: CompetitorSynthesisOutput;
  objectionAnalysis?: ObjectionAnalysisOutput;
  positioningAnalysis?: DifferentiationBuilderOutput;
  competitiveMatrixOverride?: CompetitiveMatrixOutput;
  positioningMapOverride?: PositioningMapData;
  profile: SaasProfileFormValues;
  status?: ConversionGapReport["status"];
  createdAt?: string;
};
