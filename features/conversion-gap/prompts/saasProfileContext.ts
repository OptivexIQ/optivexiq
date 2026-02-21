import type { BillingCurrency } from "@/features/billing/types/billing.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import {
  formatAcvRangeLabel,
  formatRevenueStageLabel,
} from "@/features/saas-profile/utils/monetaryLabels";

export type SaaSProfileContext = {
  icpRole: string;
  primaryPain: string;
  buyingTrigger: string;
  websiteUrl: string;
  acvRange: string;
  revenueStage: string;
  salesMotion: string;
  conversionGoal: string;
  pricingModel: string;
  keyObjections: string[];
  proofPoints: string[];
  differentiationMatrix: Array<{
    competitor: string;
    ourAdvantage: string;
    theirAdvantage: string;
  }>;
};

function formatGoal(goal: SaasProfileFormValues["conversionGoal"]): string {
  if (goal === "trial") return "Get more free trials";
  if (goal === "paid") return "Convert to paid";
  if (goal === "educate") return "Educate before sales";
  return "Get more demos";
}

export function buildPromptProfileContext(
  profile: SaasProfileFormValues,
  currency: BillingCurrency,
): SaaSProfileContext {
  return {
    icpRole: profile.icpRole,
    primaryPain: profile.primaryPain,
    buyingTrigger: profile.buyingTrigger,
    websiteUrl: profile.websiteUrl,
    acvRange: formatAcvRangeLabel(profile.acvRange, currency, profile.acvRange),
    revenueStage: formatRevenueStageLabel(
      profile.revenueStage,
      currency,
      profile.revenueStage,
    ),
    salesMotion: profile.salesMotion,
    conversionGoal: formatGoal(profile.conversionGoal),
    pricingModel: profile.pricingModel,
    keyObjections: profile.keyObjections
      .map((item) => item.value.trim())
      .filter((item) => item.length > 0),
    proofPoints: profile.proofPoints
      .map((item) => item.value.trim())
      .filter((item) => item.length > 0),
    differentiationMatrix: profile.differentiationMatrix,
  };
}
