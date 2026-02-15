import type {
  ConversionRewrite,
  CompetitiveCounterOutput,
  DifferentiationOutput,
  GapAnalysisOutput,
  HeroOutput,
  ObjectionOutput,
  PricingOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export function composeConversionRewrite(
  profile: SaasProfileFormValues,
  gapData: {
    gapAnalysis: GapAnalysisOutput;
    hero: HeroOutput;
    pricing: PricingOutput;
    objections: ObjectionOutput;
    differentiation: DifferentiationOutput;
    competitiveCounter: CompetitiveCounterOutput;
  },
): ConversionRewrite {
  return {
    profile,
    gapAnalysis: gapData.gapAnalysis,
    hero: gapData.hero,
    pricing: gapData.pricing,
    objections: gapData.objections,
    differentiation: gapData.differentiation,
    competitiveCounter: gapData.competitiveCounter,
  };
}
