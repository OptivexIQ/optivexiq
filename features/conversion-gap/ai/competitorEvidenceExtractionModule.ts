import { z } from "zod";
import type { ExtractedPageContent } from "@/features/conversion-gap/types/gap.types";
import {
  runValidatedModule,
  type ModuleUsage,
} from "@/features/conversion-gap/services/moduleRuntimeService";

const evidenceSnippetSchema = z.object({
  topic: z.string().trim().min(1),
  snippet: z.string().trim().min(20),
});

export const competitorEvidenceExtractionSchema = z.object({
  coreValuePropositions: z.array(z.string().trim().min(1)).min(1),
  positioningClaims: z.array(z.string().trim().min(1)).min(1),
  differentiators: z.array(z.string().trim().min(1)).min(1),
  pricingSignals: z.array(z.string().trim().min(1)).min(1),
  targetAudienceCues: z.array(z.string().trim().min(1)).min(1),
  objectionFraming: z.array(z.string().trim().min(1)).min(1),
  proofElements: z.array(z.string().trim().min(1)).min(1),
  evidenceSnippets: z.array(evidenceSnippetSchema).min(3),
});

export type CompetitorEvidenceExtractionOutput = z.infer<
  typeof competitorEvidenceExtractionSchema
>;

function compactContent(content: ExtractedPageContent) {
  return {
    url: content.url,
    headline: content.headline,
    subheadline: content.subheadline,
    pricingTableText: content.pricingTableText.slice(0, 1500),
    faqBlocks: content.faqBlocks.slice(0, 10),
    rawText: content.rawText.slice(0, 5000),
  };
}

function hasSpecificSignals(data: CompetitorEvidenceExtractionOutput) {
  const evidenceLongEnough = data.evidenceSnippets.some(
    (item) => item.snippet.trim().length >= 30,
  );
  const categoryCount = [
    data.coreValuePropositions.length,
    data.positioningClaims.length,
    data.differentiators.length,
    data.pricingSignals.length,
    data.targetAudienceCues.length,
    data.objectionFraming.length,
    data.proofElements.length,
  ].filter((value) => value > 0).length;

  return evidenceLongEnough && categoryCount >= 6;
}

export async function runCompetitorEvidenceExtractionModule(input: {
  competitorName: string;
  content: ExtractedPageContent;
}): Promise<{ data: CompetitorEvidenceExtractionOutput; usage: ModuleUsage }> {
  const schemaExample: CompetitorEvidenceExtractionOutput = {
    coreValuePropositions: [
      "Faster activation outcomes for sales-led SaaS onboarding programs",
    ],
    positioningClaims: [
      "Platform framing centered on revenue execution confidence",
    ],
    differentiators: ["Guided implementation model for complex GTM motions"],
    pricingSignals: ["Contact-sales pricing with enterprise plan qualifiers"],
    targetAudienceCues: ["Revenue operations leaders at mid-market SaaS"],
    objectionFraming: ["Addresses implementation risk with guided onboarding"],
    proofElements: ["Customer proof references tied to win-rate outcomes"],
    evidenceSnippets: [
      {
        topic: "value proposition",
        snippet:
          "Accelerate activation and pipeline confidence with guided conversion intelligence workflows.",
      },
      {
        topic: "audience",
        snippet:
          "Designed for RevOps and GTM teams running multi-stakeholder sales processes.",
      },
      {
        topic: "pricing",
        snippet:
          "Contact sales for enterprise pricing, implementation support, and security review workflows.",
      },
    ],
  };

  const system = [
    "You are a SaaS competitive intelligence analyst.",
    "Extract only evidence-backed claims from provided source material.",
    "Do not infer capabilities absent from source text.",
    "Return strict JSON only; no markdown or extra keys.",
  ].join("\n");

  const user = JSON.stringify(
    {
      task: "Extract structured competitor evidence from one competitor page corpus.",
      competitorName: input.competitorName,
      competitorPage: compactContent(input.content),
      outputContract: schemaExample,
    },
    null,
    2,
  );

  const result = await runValidatedModule<CompetitorEvidenceExtractionOutput>({
    moduleName: "competitorEvidenceExtraction",
    schema: competitorEvidenceExtractionSchema,
    schemaExample,
    system,
    user,
  });

  if (!hasSpecificSignals(result.data)) {
    throw new Error("competitor_evidence_extraction_not_specific");
  }

  return result;
}
