import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

export type ImplementationDifficulty = "low" | "medium" | "high";
export type ExpectedImpact = "low" | "medium" | "high";

export type DifferentiationOpportunity = {
  theme: string;
  rationale: string;
  implementationDifficulty: ImplementationDifficulty;
  expectedImpact: ExpectedImpact;
};

export type DifferentiationBuilderInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
};

export type DifferentiationBuilderOutput = {
  narrativeSimilarityScore: number;
  overlapAreas: string[];
  uniqueStrengthSignals: string[];
  underleveragedStrengths: string[];
  differentiationOpportunities: DifferentiationOpportunity[];
  positioningStrategyRecommendations: string[];
  highRiskParityZones: string[];
  enterpriseDifferentiators: string[];
};

const ENTERPRISE_KEYWORDS = [
  "security",
  "compliance",
  "soc 2",
  "gdpr",
  "hipaa",
  "audit",
  "procurement",
  "governance",
  "integration",
  "api",
  "sso",
  "access control",
  "data residency",
];

const NOISE_TOKENS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "your",
  "you",
  "our",
  "their",
  "about",
  "have",
  "has",
  "are",
  "was",
  "were",
  "will",
  "can",
  "all",
  "more",
  "most",
  "less",
  "very",
  "also",
  "only",
  "than",
  "where",
  "when",
  "while",
  "what",
  "which",
  "who",
  "how",
  "why",
  "just",
  "not",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toTokens(value: string): string[] {
  return normalize(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !NOISE_TOKENS.has(token));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function corpusFromCompetitors(competitors: CompetitorInsight[]): string {
  return competitors
    .map((competitor) => {
      const parts: string[] = [competitor.name];
      if (typeof competitor.summary === "string") {
        parts.push(competitor.summary);
      }
      if (Array.isArray(competitor.strengths)) {
        parts.push(...competitor.strengths);
      }
      if (Array.isArray(competitor.positioning)) {
        parts.push(...competitor.positioning);
      }
      if (Array.isArray(competitor.weaknesses)) {
        parts.push(...competitor.weaknesses);
      }
      return parts.join(" ");
    })
    .join(" ");
}

function deriveOverlapAreas(input: DifferentiationBuilderInput): string[] {
  const companyTokens = new Set(toTokens(input.companyContent.rawText));
  const competitorTokens = toTokens(corpusFromCompetitors(input.competitors));
  const overlapFromText = competitorTokens
    .filter((token) => companyTokens.has(token))
    .slice(0, 8)
    .map((token) => `Shared narrative around ${token}`);

  return unique([
    ...input.gapAnalysis.messagingOverlap,
    ...input.gapAnalysis.differentiationGaps,
    ...overlapFromText,
  ]).slice(0, 8);
}

function deriveUniqueStrengthSignals(input: DifferentiationBuilderInput): string[] {
  const matrixSignals = input.profile.differentiationMatrix
    .map((row) => row.ourAdvantage)
    .filter((value) => normalize(value).length > 0);
  const proofSignals = input.profile.proofPoints
    .map((item) => item.value)
    .filter((value) => normalize(value).length > 0);

  return unique([...matrixSignals, ...proofSignals]).slice(0, 12);
}

function deriveUnderleveragedStrengths(
  strengths: string[],
  companyContent: ExtractedPageContent,
  pricingContent: ExtractedPageContent | null,
): string[] {
  const companyText = normalize(
    [companyContent.rawText, pricingContent?.rawText ?? "", pricingContent?.pricingTableText ?? ""].join(" "),
  );

  return strengths.filter((signal) => {
    const phrase = normalize(signal);
    if (phrase.length < 6) {
      return false;
    }
    return !companyText.includes(phrase);
  });
}

function deriveHighRiskParityZones(input: DifferentiationBuilderInput): string[] {
  const zones = unique([
    ...input.gapAnalysis.messagingOverlap,
    ...input.gapAnalysis.differentiationGaps,
    ...input.gapAnalysis.pricingClarityIssues,
  ]);

  return zones.slice(0, 6);
}

function deriveEnterpriseDifferentiators(strengths: string[]): string[] {
  const normalizedKeywords = ENTERPRISE_KEYWORDS.map((keyword) => normalize(keyword));

  const matched = strengths.filter((strength) => {
    const text = normalize(strength);
    return normalizedKeywords.some((keyword) => text.includes(keyword));
  });

  return unique(matched).slice(0, 6);
}

function difficultyFromTheme(theme: string): ImplementationDifficulty {
  const text = normalize(theme);
  if (text.includes("pricing") || text.includes("proof") || text.includes("headline")) {
    return "low";
  }
  if (text.includes("integration") || text.includes("security") || text.includes("compliance")) {
    return "high";
  }
  return "medium";
}

function impactFromTheme(theme: string): ExpectedImpact {
  const text = normalize(theme);
  if (
    text.includes("parity") ||
    text.includes("overlap") ||
    text.includes("risk") ||
    text.includes("switch") ||
    text.includes("roi")
  ) {
    return "high";
  }
  if (text.includes("proof") || text.includes("pricing")) {
    return "medium";
  }
  return "low";
}

function buildOpportunities(input: {
  underleveragedStrengths: string[];
  highRiskParityZones: string[];
}): DifferentiationOpportunity[] {
  const opportunities: DifferentiationOpportunity[] = [];

  for (const strength of input.underleveragedStrengths.slice(0, 4)) {
    opportunities.push({
      theme: `Operationalize strength: ${strength}`,
      rationale:
        "This signal appears in internal profile inputs but is underrepresented on homepage/pricing decision surfaces.",
      implementationDifficulty: difficultyFromTheme(strength),
      expectedImpact: impactFromTheme(strength),
    });
  }

  for (const parity of input.highRiskParityZones.slice(0, 3)) {
    opportunities.push({
      theme: `Break parity zone: ${parity}`,
      rationale:
        "Competitor overlap indicates buyers may perceive low differentiation during shortlist comparisons.",
      implementationDifficulty: "medium",
      expectedImpact: "high",
    });
  }

  return opportunities.slice(0, 6);
}

function buildRecommendations(input: {
  overlapAreas: string[];
  underleveragedStrengths: string[];
  enterpriseDifferentiators: string[];
}): string[] {
  const recommendations: string[] = [];

  if (input.overlapAreas.length > 0) {
    recommendations.push(
      "Prioritize top overlap areas in messaging architecture and replace generic parity claims with proof-backed differentiation.",
    );
  }

  if (input.underleveragedStrengths.length > 0) {
    recommendations.push(
      "Promote underleveraged strengths into homepage hero, pricing anchors, and objection-handling sections to improve shortlisting outcomes.",
    );
  }

  if (input.enterpriseDifferentiators.length > 0) {
    recommendations.push(
      "Bundle enterprise-specific differentiators into procurement-facing narrative (security, integrations, governance) for sales-led deals.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Current narrative is broadly differentiated; maintain signal consistency across homepage, pricing, and proof surfaces.",
    );
  }

  return recommendations;
}

function computeNarrativeSimilarityScore(input: {
  overlapAreas: string[];
  highRiskParityZones: string[];
  competitorsCount: number;
  underleveragedStrengthsCount: number;
}): number {
  const overlapComponent = clamp(input.overlapAreas.length * 12, 0, 45);
  const parityComponent = clamp(input.highRiskParityZones.length * 9, 0, 30);
  const competitorDensity = clamp(input.competitorsCount * 5, 0, 15);
  const underleveragedPenalty = clamp(input.underleveragedStrengthsCount * 3, 0, 10);

  return clamp(
    Math.round(overlapComponent + parityComponent + competitorDensity + underleveragedPenalty),
    0,
    100,
  );
}

export function runDifferentiationBuilder(
  input: DifferentiationBuilderInput,
): DifferentiationBuilderOutput {
  const overlapAreas = deriveOverlapAreas(input);
  const uniqueStrengthSignals = deriveUniqueStrengthSignals(input);
  const underleveragedStrengths = deriveUnderleveragedStrengths(
    uniqueStrengthSignals,
    input.companyContent,
    input.pricingContent,
  );
  const highRiskParityZones = deriveHighRiskParityZones(input);
  const enterpriseDifferentiators = deriveEnterpriseDifferentiators(uniqueStrengthSignals);
  const differentiationOpportunities = buildOpportunities({
    underleveragedStrengths,
    highRiskParityZones,
  });
  const positioningStrategyRecommendations = buildRecommendations({
    overlapAreas,
    underleveragedStrengths,
    enterpriseDifferentiators,
  });

  const narrativeSimilarityScore = computeNarrativeSimilarityScore({
    overlapAreas,
    highRiskParityZones,
    competitorsCount: input.competitors.length,
    underleveragedStrengthsCount: underleveragedStrengths.length,
  });

  return {
    narrativeSimilarityScore,
    overlapAreas,
    uniqueStrengthSignals,
    underleveragedStrengths,
    differentiationOpportunities,
    positioningStrategyRecommendations,
    highRiskParityZones,
    enterpriseDifferentiators,
  };
}