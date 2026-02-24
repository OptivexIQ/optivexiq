import { z } from "zod";
import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import {
  runValidatedModule,
  type ModuleUsage,
} from "@/features/conversion-gap/services/moduleRuntimeService";

const difficultySchema = z.enum(["low", "medium", "high"]);
const impactSchema = z.enum(["low", "medium", "high"]);
const actionPrioritySchema = z.enum(["P0", "P1", "P2"]);

const evidenceSchema = z.object({
  competitor: z.string().trim().min(1),
  snippet: z.string().trim().min(20),
});

const competitiveInsightSchema = z.object({
  claim: z.string().trim().min(1),
  evidence: z.array(evidenceSchema).min(1),
  reasoning: z.string().trim().min(20),
  confidence: z.number().min(0).max(1),
  actionPriority: actionPrioritySchema,
});

export const competitiveInsightsSynthesisSchema = z.object({
  narrativeSimilarityScore: z.number().min(0).max(100),
  overlapAreas: z.array(z.string().trim().min(1)).min(1),
  uniqueStrengthSignals: z.array(z.string().trim().min(1)).min(1),
  underleveragedStrengths: z.array(z.string().trim().min(1)).min(1),
  differentiationOpportunities: z
    .array(
      z.object({
        theme: z.string().trim().min(1),
        rationale: z.string().trim().min(1),
        implementationDifficulty: difficultySchema,
        expectedImpact: impactSchema,
      }),
    )
    .min(1),
  positioningStrategyRecommendations: z.array(z.string().trim().min(1)).min(1),
  highRiskParityZones: z.array(z.string().trim().min(1)).min(1),
  enterpriseDifferentiators: z.array(z.string().trim().min(1)).min(1),
  strategicNarrativeDifferences: z
    .array(
      z.object({
        difference: z.string().trim().min(1),
        evidence: z.array(evidenceSchema).min(1),
        confidence: z.number().min(0).max(1),
        actionPriority: actionPrioritySchema,
      }),
    )
    .min(1),
  underservedPositioningTerritories: z
    .array(
      z.object({
        territory: z.string().trim().min(1),
        rationale: z.string().trim().min(20),
        evidence: z.array(evidenceSchema).min(1),
        confidence: z.number().min(0).max(1),
        actionPriority: actionPrioritySchema,
      }),
    )
    .min(1),
  credibleDifferentiationAxes: z
    .array(
      z.object({
        axis: z.string().trim().min(1),
        rationale: z.string().trim().min(20),
        evidence: z.array(evidenceSchema).min(1),
        confidence: z.number().min(0).max(1),
        actionPriority: actionPrioritySchema,
      }),
    )
    .min(1),
  marketPerceptionRisks: z
    .array(
      z.object({
        risk: z.string().trim().min(1),
        whyItMatters: z.string().trim().min(20),
        evidence: z.array(evidenceSchema).min(1),
        confidence: z.number().min(0).max(1),
        actionPriority: actionPrioritySchema,
      }),
    )
    .min(1),
  recommendedPositioningDirection: z.object({
    direction: z.string().trim().min(1),
    rationale: z.string().trim().min(20),
    supportingEvidence: z.array(evidenceSchema).min(1),
    confidence: z.number().min(0).max(1),
    actionPriority: actionPrioritySchema,
  }),
  competitiveInsights: z.array(competitiveInsightSchema).min(2),
});

export type CompetitiveInsightsSynthesisOutput = z.infer<
  typeof competitiveInsightsSynthesisSchema
>;

function compactContent(content: ExtractedPageContent | null) {
  if (!content) {
    return null;
  }

  return {
    url: content.url,
    headline: content.headline,
    subheadline: content.subheadline,
    pricingTableText: content.pricingTableText.slice(0, 1500),
    faqBlocks: content.faqBlocks.slice(0, 10),
    rawText: content.rawText.slice(0, 4500),
  };
}

function compactCompetitor(competitor: CompetitorInsight) {
  return {
    name: competitor.name,
    url: competitor.url ?? null,
    extraction: competitor.extraction ?? null,
    summary: competitor.summary ?? null,
    strengths: competitor.strengths ?? [],
    positioning: competitor.positioning ?? [],
  };
}

function hasEvidenceSpecificity(data: CompetitiveInsightsSynthesisOutput) {
  const insightsSpecific = data.competitiveInsights.every((item) => {
    const hasMeaningfulReasoning = item.reasoning.trim().length >= 20;
    const hasEvidence = item.evidence.some(
      (evidence) => evidence.snippet.trim().length >= 20,
    );
    return hasMeaningfulReasoning && hasEvidence;
  });

  const strategicSpecific =
    data.strategicNarrativeDifferences.every((item) =>
      item.evidence.some((evidence) => evidence.snippet.trim().length >= 20),
    ) &&
    data.underservedPositioningTerritories.every((item) =>
      item.evidence.some((evidence) => evidence.snippet.trim().length >= 20),
    ) &&
    data.credibleDifferentiationAxes.every((item) =>
      item.evidence.some((evidence) => evidence.snippet.trim().length >= 20),
    ) &&
    data.marketPerceptionRisks.every((item) =>
      item.evidence.some((evidence) => evidence.snippet.trim().length >= 20),
    ) &&
    data.recommendedPositioningDirection.supportingEvidence.some(
      (evidence) => evidence.snippet.trim().length >= 20,
    );

  return insightsSpecific && strategicSpecific;
}

function hasSpecificLanguage(data: CompetitiveInsightsSynthesisOutput): boolean {
  const textCorpus = [
    ...data.overlapAreas,
    ...data.highRiskParityZones,
    ...data.positioningStrategyRecommendations,
    ...data.strategicNarrativeDifferences.map((item) => item.difference),
    ...data.underservedPositioningTerritories.map((item) => item.territory),
    ...data.credibleDifferentiationAxes.map((item) => item.axis),
    ...data.marketPerceptionRisks.map((item) => item.risk),
    data.recommendedPositioningDirection.direction,
    ...data.competitiveInsights.map((item) => item.claim),
  ]
    .join(" ")
    .toLowerCase();

  const genericPhrases = [
    "improve conversion",
    "increase growth",
    "better messaging",
    "optimize funnel",
    "drive results",
  ];
  const genericHits = genericPhrases.filter((phrase) =>
    textCorpus.includes(phrase),
  ).length;

  const competitorMentions = new Set(
    data.competitiveInsights.flatMap((item) =>
      item.evidence.map((evidence) => evidence.competitor.toLowerCase().trim()),
    ),
  );
  const mentionsNamedCompetitor = [...competitorMentions].some(
    (value) => value !== "market_signal" && value !== "snapshot_signal",
  );

  return genericHits <= 1 && mentionsNamedCompetitor;
}

export async function runCompetitiveInsightsSynthesisModule(input: {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
}): Promise<{ data: CompetitiveInsightsSynthesisOutput; usage: ModuleUsage }> {
  const schemaExample: CompetitiveInsightsSynthesisOutput = {
    narrativeSimilarityScore: 68,
    overlapAreas: [
      "Category-level parity around generic conversion optimization framing",
    ],
    uniqueStrengthSignals: [
      "Decision-grade conversion intelligence tied to pipeline risk visibility",
    ],
    underleveragedStrengths: [
      "Cross-functional decision traceability for GTM and revenue leadership",
    ],
    differentiationOpportunities: [
      {
        theme: "Lead with decision infrastructure outcomes",
        rationale:
          "Competitors cluster around copy optimization claims while your inputs support strategic decisioning outcomes.",
        implementationDifficulty: "medium",
        expectedImpact: "high",
      },
    ],
    positioningStrategyRecommendations: [
      "Shift headline hierarchy from optimization language to risk-adjusted revenue decisioning.",
    ],
    highRiskParityZones: [
      "Outcome claims that lack quantified proof in shortlist comparisons",
    ],
    enterpriseDifferentiators: [
      "Auditable conversion decision records for cross-team alignment",
    ],
    strategicNarrativeDifferences: [
      {
        difference:
          "You can credibly position decision traceability while competitors stay at optimization headline level.",
        evidence: [
          {
            competitor: "example-competitor-a.com",
            snippet:
              "Improve conversion rates with AI messaging optimization and automated experimentation workflows.",
          },
        ],
        confidence: 0.77,
        actionPriority: "P0",
      },
    ],
    underservedPositioningTerritories: [
      {
        territory:
          "Cross-functional GTM decision governance for RevOps + product marketing alignment.",
        rationale:
          "Competitor extracts emphasize execution velocity but under-index on governance and decision traceability narratives.",
        evidence: [
          {
            competitor: "example-competitor-b.com",
            snippet:
              "Launch tests faster with AI-assisted messaging and campaign optimization workflows.",
          },
        ],
        confidence: 0.71,
        actionPriority: "P1",
      },
    ],
    credibleDifferentiationAxes: [
      {
        axis: "Decision traceability and pipeline-risk linkage",
        rationale:
          "This axis is grounded in profile and messaging inputs and is not directly mirrored in competitor positioning language.",
        evidence: [
          {
            competitor: "example-competitor-a.com",
            snippet:
              "Focuses on optimization workflows and conversion experiments without explicit decision-audit narrative.",
          },
        ],
        confidence: 0.75,
        actionPriority: "P0",
      },
    ],
    marketPerceptionRisks: [
      {
        risk: "Perceived parity as another AI copy optimization vendor",
        whyItMatters:
          "Buyers may collapse category distinctions during shortlist evaluation and default to lower-friction alternatives.",
        evidence: [
          {
            competitor: "example-competitor-b.com",
            snippet:
              "AI messaging optimization and conversion recommendations for faster campaign wins.",
          },
        ],
        confidence: 0.79,
        actionPriority: "P0",
      },
    ],
    recommendedPositioningDirection: {
      direction:
        "Position as conversion decision infrastructure for revenue teams, not copy optimization tooling.",
      rationale:
        "Competitor language clusters around optimization outcomes while your inputs support stronger strategic decision-system framing.",
      supportingEvidence: [
        {
          competitor: "example-competitor-a.com",
          snippet:
            "Automated experimentation workflows to improve conversion messaging performance.",
        },
      ],
      confidence: 0.82,
      actionPriority: "P0",
    },
    competitiveInsights: [
      {
        claim:
          "Two competitors emphasize optimization outcomes without decision traceability language.",
        evidence: [
          {
            competitor: "example-competitor-a.com",
            snippet:
              "Improve conversion rates with AI messaging optimization and automated experimentation workflows.",
          },
        ],
        reasoning:
          "This framing competes on tactical optimization, leaving room for differentiation around executive decision infrastructure.",
        confidence: 0.78,
        actionPriority: "P0",
      },
      {
        claim:
          "Enterprise buying friction is addressed by competitors through implementation assurances.",
        evidence: [
          {
            competitor: "example-competitor-b.com",
            snippet:
              "Dedicated onboarding specialists and migration support reduce implementation risk for enterprise teams.",
          },
        ],
        reasoning:
          "Positioning should explicitly address implementation confidence and rollout control to remain competitive in sales-led motion.",
        confidence: 0.74,
        actionPriority: "P1",
      },
    ],
  };

  const system = [
    "You are a principal SaaS positioning intelligence strategist.",
    "Use provided source extracts only. Do not invent competitor capabilities.",
    "Use AI synthesis as primary reasoning engine for strategic positioning output.",
    "Inputs include user positioning, ICP data, competitor extracts, objection patterns, and pricing signals.",
    "Every output section must include confidence scoring, supporting evidence, and action priority.",
    "Reject generic advice that could apply to any SaaS product.",
    "All claims must be specific to provided competitor evidence and ICP context.",
    "Return strict JSON only; no markdown or extra keys.",
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Generate evidence-backed comparative positioning intelligence.",
      requiredOutputs: [
        "strategic narrative differences",
        "underserved positioning territory",
        "credible differentiation axes",
        "market perception risks",
        "recommended positioning direction",
      ],
      userPositioning: {
        differentiationMatrix: input.profile.differentiationMatrix,
        proofPoints: input.profile.proofPoints,
      },
      icpData: {
        icpRole: input.profile.icpRole,
        acvRange: input.profile.acvRange,
        salesMotion: input.profile.salesMotion,
        revenueStage: input.profile.revenueStage,
      },
      objectionPatterns: {
        profileKeyObjections: input.profile.keyObjections,
        missingObjections: input.gapAnalysis.missingObjections,
      },
      pricingSignals: {
        pricingModel: input.profile.pricingModel,
        pricingClarityIssues: input.gapAnalysis.pricingClarityIssues,
        pricingPage: compactContent(input.pricingContent),
      },
      profile: input.profile,
      gapAnalysis: input.gapAnalysis,
      company: compactContent(input.companyContent),
      competitors: input.competitors.map(compactCompetitor),
      outputContract: schemaExample,
    },
    null,
    2,
  );

  const result = await runValidatedModule<CompetitiveInsightsSynthesisOutput>({
    moduleName: "competitiveInsightsSynthesis",
    schema: competitiveInsightsSynthesisSchema,
    schemaExample,
    system,
    user,
  });

  if (!hasEvidenceSpecificity(result.data)) {
    throw new Error("competitive_insights_not_specific");
  }
  if (!hasSpecificLanguage(result.data)) {
    throw new Error("competitive_insights_generic_output_rejected");
  }

  return result;
}
