export type PriorityTier = "Critical" | "High" | "Medium";

export type PriorityItem = {
  issue: string;
  impactScore: number;
  effortEstimate: number;
  priorityScore: number;
  tier: PriorityTier;
};

export type PriorityDrivers = {
  revenueExposure: number;
  funnelStageImpact: number;
  competitiveOverlap: number;
  objectionWeakness: number;
};

export type EffortDrivers = {
  scopeComplexity: number;
  structuralChange: number;
};

export type PriorityInput = {
  issue: string;
  impact: PriorityDrivers;
  effort: EffortDrivers;
};
