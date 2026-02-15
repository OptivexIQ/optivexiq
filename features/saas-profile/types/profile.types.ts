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
  acvRange: "<€10k" | "€10k-50k" | "€50k-150k" | "€150k-500k" | "€500k+";
  revenueStage: "pre" | "<€10k" | "€10k-50k" | "€50k+";
  salesMotion: string;
  conversionGoal: "demo" | "trial" | "paid" | "educate";
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
  acvRange: "<€10k",
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
