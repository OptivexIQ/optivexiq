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
  profile: SaasProfileFormValues;
  status?: ConversionGapReport["status"];
  createdAt?: string;
};

