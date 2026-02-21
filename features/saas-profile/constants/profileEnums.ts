export const ACV_RANGE_VALUES = [
  "lt_10k",
  "10k_50k",
  "50k_150k",
  "150k_500k",
  "gte_500k",
] as const;

export const REVENUE_STAGE_VALUES = [
  "pre",
  "lt_10k",
  "10k_50k",
  "gte_50k",
] as const;

export const CONVERSION_GOAL_VALUES = [
  "demo",
  "trial",
  "paid",
  "educate",
] as const;

export type AcvRangeValue = (typeof ACV_RANGE_VALUES)[number];
export type RevenueStageValue = (typeof REVENUE_STAGE_VALUES)[number];
export type ConversionGoalValue = (typeof CONVERSION_GOAL_VALUES)[number];
