import type {
  AcvRangeValue,
  ConversionGoalValue,
  RevenueStageValue,
} from "@/features/saas-profile/constants/profileEnums";

export type DifferentiationRow = {
  competitor: string;
  ourAdvantage: string;
  theirAdvantage: string;
};

export type TextItem = {
  value: string;
};

export type SaasProfileFormValues = {
  icpRole: string;
  primaryPain: string;
  buyingTrigger: string;
  websiteUrl: string;
  acvRange: AcvRangeValue;
  revenueStage: RevenueStageValue;
  salesMotion: string;
  conversionGoal: ConversionGoalValue;
  pricingModel: string;
  keyObjections: TextItem[];
  proofPoints: TextItem[];
  differentiationMatrix: DifferentiationRow[];
  onboardingProgress: number;
  onboardingCompleted: boolean;
  updatedAt?: string | null;
  onboardingCompletedAt?: string | null;
};

export const defaultSaasProfileValues: SaasProfileFormValues = {
  icpRole: "",
  primaryPain: "",
  buyingTrigger: "",
  websiteUrl: "",
  acvRange: "lt_10k",
  revenueStage: "pre",
  salesMotion: "",
  conversionGoal: "demo",
  pricingModel: "",
  keyObjections: [{ value: "" }],
  proofPoints: [{ value: "" }],
  differentiationMatrix: [
    {
      competitor: "",
      ourAdvantage: "",
      theirAdvantage: "",
    },
  ],
  onboardingProgress: 0,
  onboardingCompleted: false,
  updatedAt: null,
  onboardingCompletedAt: null,
};
