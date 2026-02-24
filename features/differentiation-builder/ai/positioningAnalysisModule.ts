import { z } from "zod";
import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { CompetitorSynthesisOutput } from "@/features/conversion-gap/services/competitorSynthesisService";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import {
  runValidatedModule,
  type ModuleUsage,
} from "@/features/conversion-gap/services/moduleRuntimeService";
import type { DifferentiationBuilderOutput } from "@/features/differentiation-builder/services/differentiationBuilderService";

const difficultySchema = z.enum(["low", "medium", "high"]);
const impactSchema = z.enum(["low", "medium", "high"]);

export const positioningAnalysisOutputSchema = z.object({
  narrativeSimilarityScore: z.number().min(0).max(100),
  overlapAreas: z.array(z.string().min(1)),
  uniqueStrengthSignals: z.array(z.string().min(1)),
  underleveragedStrengths: z.array(z.string().min(1)),
  differentiationOpportunities: z.array(
    z.object({
      theme: z.string().min(1),
      rationale: z.string().min(1),
      implementationDifficulty: difficultySchema,
      expectedImpact: impactSchema,
    }),
  ),
  positioningStrategyRecommendations: z.array(z.string().min(1)),
  highRiskParityZones: z.array(z.string().min(1)),
  enterpriseDifferentiators: z.array(z.string().min(1)),
});

export type PositioningAnalysisOutput = z.infer<
  typeof positioningAnalysisOutputSchema
>;

type PositioningAnalysisInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  competitorSynthesis?: CompetitorSynthesisOutput | null;
};

const positioningDimensions = [
  "Value proposition uniqueness",
  "Category positioning",
  "Feature parity perception",
  "Outcome framing",
  "Audience targeting overlap",
  "Pricing model signaling",
  "Risk reduction messaging",
  "Proof and credibility positioning",
] as const;

const schemaExample: DifferentiationBuilderOutput = {
  narrativeSimilarityScore: 72,
  overlapAreas: [
    "Category claim parity around conversion optimization",
    "Outcome framing overlap in demo acceleration language",
  ],
  uniqueStrengthSignals: [
    "Fast implementation with no-code onboarding",
    "Decision-grade conversion diagnostics tied to pipeline risk",
  ],
  underleveragedStrengths: [
    "Decision-grade conversion diagnostics tied to pipeline risk",
  ],
  differentiationOpportunities: [
    {
      theme: "Shift from generic optimization claims to decision infrastructure framing",
      rationale:
        "Competitors use similar optimization language, while your evidence supports a stronger decision-system narrative.",
      implementationDifficulty: "medium",
      expectedImpact: "high",
    },
  ],
  positioningStrategyRecommendations: [
    "Anchor homepage narrative on decision infrastructure outcomes, not generic AI rewrite promises.",
    "Use pricing page proof blocks to separate from parity conversion tools.",
  ],
  highRiskParityZones: [
    "AI rewrite positioning",
    "Generic conversion lift claims without quantified proof",
  ],
  enterpriseDifferentiators: [
    "Auditability of conversion decisions",
    "Operational reporting across messaging, objections, and overlap",
  ],
};

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

export async function runPositioningAnalysisModule(input: PositioningAnalysisInput): Promise<{
  data: PositioningAnalysisOutput;
  usage: ModuleUsage;
}> {
  const system = [
    "You are an enterprise SaaS positioning and differentiation intelligence analyst.",
    "Task: produce competitive positioning synthesis that is decision-grade, evidence-linked, and non-generic.",
    "Output MUST be strict JSON matching the contract exactly.",
    "Do not output markdown, prose, code fences, or additional top-level keys.",
    "Use ONLY these implementationDifficulty values: low, medium, high.",
    "Use ONLY these expectedImpact values: low, medium, high.",
    "Evaluate all analysis dimensions:",
    ...positioningDimensions.map((dimension) => `- ${dimension}`),
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Generate structured differentiation and positioning intelligence for SaaS messaging decisioning.",
      dimensions: positioningDimensions,
      profile: input.profile,
      gapAnalysis: input.gapAnalysis,
      competitorSynthesis: input.competitorSynthesis ?? null,
      homepage: compactContent(input.companyContent),
      pricingPage: compactContent(input.pricingContent),
      competitors: input.competitors.map((competitor) => ({
        name: competitor.name,
        url: competitor.url ?? null,
        summary: competitor.summary ?? null,
        strengths: competitor.strengths ?? [],
        weaknesses: competitor.weaknesses ?? [],
        positioning: competitor.positioning ?? [],
      })),
      outputContract: schemaExample,
    },
    null,
    2,
  );

  try {
    return await runValidatedModule<PositioningAnalysisOutput>({
      moduleName: "positioningAnalysis",
      schema: positioningAnalysisOutputSchema,
      schemaExample,
      system,
      user,
    });
  } catch (error) {
    throw new Error(
      `positioning_analysis_failed:${error instanceof Error ? error.message : "unknown_error"}`,
    );
  }
}