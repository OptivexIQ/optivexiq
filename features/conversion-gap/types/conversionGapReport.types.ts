import type { PriorityItem } from "@/features/conversion-gap/types/priority.types";

export type ThreatLevel = "low" | "medium" | "high";

export type MessagingOverlapItem = {
  competitor: string;
  you: number;
  competitors: number;
  risk: ThreatLevel;
};

export type MessagingOverlap = {
  items: MessagingOverlapItem[];
  insight: string;
  ctaLabel: string;
};

export type RevenueImpact = {
  pipelineAtRisk: number;
  estimatedLiftPercent: number;
  modeledWinRateDelta: number;
  projectedPipelineRecovery: number;
};

export type ScoringBreakdown = {
  clarity: number;
  differentiation: number;
  objectionCoverage: number;
  competitiveOverlap: number;
  pricingExposure: number;
  weightedScore: number;
  revenueRiskSignal: number;
  competitiveThreatSignal: number;
};

export type Diagnosis = {
  summary: string;
  primaryGap: string;
  primaryRisk: string;
  primaryOpportunity: string;
};

export type RewriteRecommendation = {
  title: string;
  slug: string;
  category: string;
  metric: string;
  copy: string;
  iconName?: "home" | "pricing" | "trust" | "objection" | "default";
};

export type ObjectionCoverageItem = {
  objection: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence?: string;
  impact?: string;
};

export type ObjectionCoverageGuidance = {
  objection: string;
  recommendedStrategy: string;
};

export type ObjectionCoverage = {
  score: number;
  identified: ObjectionCoverageItem[];
  missing: ObjectionCoverageItem[];
  risks: string[];
  guidance: ObjectionCoverageGuidance[];
  dimensionScores?: Record<string, number>;
};

export type CompetitiveMatrixProfileRow = {
  competitor: string;
  ourAdvantage: string;
  theirAdvantage: string;
};

export type CompetitiveMatrixCompetitorRow = {
  competitor: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string[];
};

export type CompetitiveMatrix = {
  profileMatrix: CompetitiveMatrixProfileRow[];
  competitorRows: CompetitiveMatrixCompetitorRow[];
  differentiators: Array<{ claim: string; proof: string }>;
  counters: Array<{ competitor: string; counter: string }>;
  coreDifferentiationTension?: string;
  substitutionRiskNarrative?: string;
  counterPositioningVector?: string;
  pricingDefenseNarrative?: string;
};

export type DifferentiationInsights = {
  similarityScore: number;
  overlapAreas: string[];
  opportunities: Array<{
    theme: string;
    rationale: string;
    implementationDifficulty: "low" | "medium" | "high";
    expectedImpact: "low" | "medium" | "high";
  }>;
  strategyRecommendations: string[];
  parityRisks: string[];
  strategicNarrativeDifferences?: Array<{
    difference: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  underservedPositioningTerritories?: Array<{
    territory: string;
    rationale: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  credibleDifferentiationAxes?: Array<{
    axis: string;
    rationale: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  marketPerceptionRisks?: Array<{
    risk: string;
    whyItMatters: string;
    evidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  }>;
  recommendedPositioningDirection?: {
    direction: string;
    rationale: string;
    supportingEvidence: Array<{ competitor: string; snippet: string }>;
    confidence: number;
    actionPriority: "P0" | "P1" | "P2";
  };
};

export type CompetitiveInsight = {
  claim: string;
  evidence: Array<{
    competitor: string;
    snippet: string;
  }>;
  reasoning: string;
  confidence: number;
  actionPriority?: "P0" | "P1" | "P2";
};

export type ConversionGapReport = {
  id: string;
  company: string;
  segment: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: string;

  conversionScore: number;
  funnelRisk: number;
  winRateDelta: number;
  pipelineAtRisk: number;
  differentiationScore: number;
  pricingScore: number;
  clarityScore: number;
  confidenceScore: number;
  threatLevel: ThreatLevel;
  scoringModelVersion: string;
  scoringBreakdown: ScoringBreakdown;

  executiveNarrative: string;
  executiveSummary: string;
  diagnosis: Diagnosis;

  messagingOverlap: MessagingOverlap;
  objectionCoverage: ObjectionCoverage;
  differentiationInsights?: DifferentiationInsights;
  competitiveInsights: CompetitiveInsight[];
  competitiveMatrix: CompetitiveMatrix;
  positioningMap: Record<string, unknown>;
  rewrites: Record<string, unknown>;
  rewriteRecommendations: RewriteRecommendation[];
  competitor_synthesis?: {
    coreDifferentiationTension: string;
    messagingOverlapRisk: {
      level: "low" | "moderate" | "high";
      explanation: string;
    };
    substitutionRiskNarrative: string;
    counterPositioningVector: string;
    pricingDefenseNarrative: string;
  };

  revenueImpact: RevenueImpact;
  revenueProjection: {
    estimatedLiftPercent: number;
    modeledWinRateDelta: number;
    projectedPipelineRecovery: number;
  };

  priorityIssues: PriorityItem[];
  priorityIndex: PriorityItem[];
};
