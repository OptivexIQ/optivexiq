import { z } from "zod";
import type {
  CompetitorInsight,
  ExtractedPageContent,
  GapAnalysisOutput,
  PricingOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import {
  runValidatedModule,
  type ModuleUsage,
} from "@/features/conversion-gap/services/moduleRuntimeService";

const objectionSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const objectionAnalysisOutputSchema = z.object({
  identifiedObjections: z.array(
    z.object({
      objection: z.string().min(1),
      severity: objectionSeveritySchema,
      evidence: z.string().min(1),
    }),
  ),
  missingObjections: z.array(
    z.object({
      objection: z.string().min(1),
      severity: objectionSeveritySchema,
      impact: z.string().min(1),
    }),
  ),
  objectionCoverageScore: z.number().min(0).max(100),
  criticalRisks: z.array(z.string().min(1)),
  mitigationGuidance: z.array(
    z.object({
      objection: z.string().min(1),
      recommendedStrategy: z.string().min(1),
    }),
  ),
  quickWins: z.array(z.string().min(1)),
  enterpriseRisks: z.array(z.string().min(1)),
});

export type ObjectionAnalysisOutput = z.infer<typeof objectionAnalysisOutputSchema>;

type ObjectionAnalysisInput = {
  companyContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitors: CompetitorInsight[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  pricingContext?: PricingOutput | null;
};

const objectionDimensions = [
  "Trust risk",
  "Cost concerns",
  "Implementation effort",
  "Switching risk",
  "ROI uncertainty",
  "Security/compliance",
  "Integration complexity",
  "Vendor lock-in",
  "Internal buy-in difficulty",
] as const;

const schemaExample: ObjectionAnalysisOutput = {
  identifiedObjections: [
    {
      objection: "Security and compliance review risk",
      severity: "high",
      evidence:
        "homepage_faq: Security FAQ is generic and does not mention controls, audits, or data handling ownership.",
    },
  ],
  missingObjections: [
    {
      objection: "Implementation effort",
      severity: "critical",
      impact:
        "Buyers cannot estimate deployment time or internal effort, creating late-stage deal hesitation.",
    },
  ],
  objectionCoverageScore: 37,
  criticalRisks: [
    "Implementation effort and security concerns are unresolved in decision-stage messaging.",
  ],
  mitigationGuidance: [
    {
      objection: "Implementation effort",
      recommendedStrategy:
        "Publish phased onboarding path with timeline, owner roles, and first-value milestone.",
    },
  ],
  quickWins: [
    "Add a deployment timeline block on pricing and FAQ sections.",
    "Add one quantified proof point per top objection near CTA paths.",
  ],
  enterpriseRisks: [
    "Security/compliance and procurement readiness signals are insufficient for enterprise review workflows.",
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

export async function runObjectionAnalysisModule(input: ObjectionAnalysisInput): Promise<{
  data: ObjectionAnalysisOutput;
  usage: ModuleUsage;
}> {
  const system = [
    "You are an enterprise SaaS objection intelligence analyst.",
    "Task: detect covered and uncovered buyer objections from provided evidence and produce decision-ready mitigation guidance.",
    "Output MUST be strict JSON matching the contract exactly.",
    "Do not output markdown, prose, code fences, or additional top-level keys.",
    "Use ONLY these severity values: low, medium, high, critical.",
    "Respect objection dimensions:",
    ...objectionDimensions.map((dimension) => `- ${dimension}`),
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Produce structured objection risk analysis for SaaS conversion decisioning.",
      dimensions: objectionDimensions,
      profile: input.profile,
      gapAnalysis: input.gapAnalysis,
      pricingContext: input.pricingContext ?? null,
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
    return await runValidatedModule<ObjectionAnalysisOutput>({
      moduleName: "objectionAnalysis",
      schema: objectionAnalysisOutputSchema,
      schemaExample,
      system,
      user,
    });
  } catch (error) {
    // Hard-fail so upstream queued report processing marks execution as failed.
    throw new Error(
      `objection_analysis_failed:${error instanceof Error ? error.message : "unknown_error"}`,
    );
  }
}
