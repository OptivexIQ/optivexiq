export type ScoringModel = {
  clarityWeight: number;
  differentiationWeight: number;
  objectionCoverageWeight: number;
  competitiveOverlapWeight: number;
  pricingExposureWeight: number;
};

export const CANONICAL_SCORING_MODEL_VERSION = "2026-02-23.v1";

export const CANONICAL_SCORING_MODEL: ScoringModel = {
  clarityWeight: 0.24,
  differentiationWeight: 0.24,
  objectionCoverageWeight: 0.2,
  competitiveOverlapWeight: 0.16,
  pricingExposureWeight: 0.16,
};

