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

const evidenceSchema = z.object({
  competitor: z.string().trim().min(1),
  snippet: z.string().trim().min(20),
});

const competitiveInsightSchema = z.object({
  claim: z.string().trim().min(1),
  evidence: z.array(evidenceSchema).min(1),
  reasoning: z.string().trim().min(20),
  confidence: z.number().min(0).max(1),
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
  return data.competitiveInsights.every((item) => {
    const hasMeaningfulReasoning = item.reasoning.trim().length >= 20;
    const hasEvidence = item.evidence.some(
      (evidence) => evidence.snippet.trim().length >= 20,
    );
    return hasMeaningfulReasoning && hasEvidence;
  });
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
      },
    ],
  };

  const system = [
    "You are a SaaS positioning intelligence strategist.",
    "Use provided source extracts only. Do not invent competitor capabilities.",
    "Every competitive insight must include evidence snippets and confidence score.",
    "Return strict JSON only; no markdown or extra keys.",
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Generate evidence-backed comparative positioning intelligence.",
      requiredOutputs: [
        "overlap areas",
        "differentiation gaps",
        "strategic risks",
        "counter-positioning opportunities",
        "confidence score per claim",
      ],
      profile: input.profile,
      gapAnalysis: input.gapAnalysis,
      company: compactContent(input.companyContent),
      pricing: compactContent(input.pricingContent),
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

  return result;
}
