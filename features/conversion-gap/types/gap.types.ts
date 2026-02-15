import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export type ExtractedPageContent = {
  url: string;
  headline: string;
  subheadline: string;
  pricingTableText: string;
  faqBlocks: string[];
  rawText: string;
};

export type GapReportStatus = "queued" | "running" | "completed" | "failed";

export type CompetitorInsight = {
  name: string;
  url?: string;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  positioning?: string[];
  extracted?: ExtractedPageContent;
};

export type GapAnalysisOutput = {
  gaps: string[];
  opportunities: string[];
  risks: string[];
  messagingOverlap: string[];
  missingObjections: string[];
  differentiationGaps: string[];
  pricingClarityIssues: string[];
};

export type HeroOutput = {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta?: string;
};

export type PricingOutput = {
  valueMetric: string;
  anchor: string;
  packagingNotes: string[];
};

export type ObjectionOutput = {
  objections: Array<{ objection: string; response: string }>;
};

export type DifferentiationOutput = {
  differentiators: Array<{ claim: string; proof: string }>;
};

export type CompetitiveCounterOutput = {
  counters: Array<{ competitor: string; counter: string }>;
};

export type ConversionRewrite = {
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  hero: HeroOutput;
  pricing: PricingOutput;
  objections: ObjectionOutput;
  differentiation: DifferentiationOutput;
  competitiveCounter: CompetitiveCounterOutput;
};
