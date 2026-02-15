import { z } from "zod";
import { runChatCompletion } from "@/features/ai/client/openaiClient";
import {
  extractJsonObject,
  parseJsonStrict,
} from "@/features/ai/streaming/structuredOutputParser";
import { logger } from "@/lib/logger";
import type {
  ExtractedPageContent,
  GapAnalysisOutput,
  HeroOutput,
  PricingOutput,
} from "@/features/conversion-gap/types/gap.types";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";

const competitorSynthesisSchema = z.object({
  coreDifferentiationTension: z.string().min(1),
  messagingOverlapRisk: z.object({
    level: z.enum(["low", "moderate", "high"]),
    explanation: z.string().min(1),
  }),
  substitutionRiskNarrative: z.string().min(1),
  counterPositioningVector: z.string().min(1),
  pricingDefenseNarrative: z.string().min(1),
});

export type CompetitorSynthesisOutput = z.infer<
  typeof competitorSynthesisSchema
>;

type CompetitorSynthesisInput = {
  homepageContent: ExtractedPageContent;
  pricingContent: ExtractedPageContent | null;
  competitorContents: ExtractedPageContent[];
  profile: SaasProfileFormValues;
  gapAnalysis: GapAnalysisOutput;
  homepageAnalysis: HeroOutput;
  pricingAnalysis: PricingOutput;
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
    faqBlocks: content.faqBlocks.slice(0, 8),
    rawText: content.rawText.slice(0, 3500),
  };
}

export async function synthesizeCompetitorIntelligence(
  input: CompetitorSynthesisInput,
): Promise<CompetitorSynthesisOutput> {
  const schemaShape = {
    coreDifferentiationTension: "string",
    messagingOverlapRisk: {
      level: "low | moderate | high",
      explanation: "string",
    },
    substitutionRiskNarrative: "string",
    counterPositioningVector: "string",
    pricingDefenseNarrative: "string",
  };

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await runChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            "You are a SaaS competitive intelligence strategist.",
            "Return ONLY strict JSON. Do not include markdown, prose, or code fences.",
            `JSON contract:\n${JSON.stringify(schemaShape, null, 2)}`,
            attempt > 1
              ? "Previous output failed schema validation. Return JSON that exactly matches keys and types."
              : null,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              task: "Synthesize comparative positioning intelligence.",
              profile: input.profile,
              gapAnalysis: input.gapAnalysis,
              homepageAnalysis: input.homepageAnalysis,
              pricingAnalysis: input.pricingAnalysis,
              homepage: compactContent(input.homepageContent),
              pricing: compactContent(input.pricingContent),
              competitors: input.competitorContents.map((item) =>
                compactContent(item),
              ),
              schema: schemaShape,
            },
            null,
            2,
          ),
        },
      ],
    });

    const strict = parseJsonStrict<unknown>(response.content);
    const candidate =
      strict.data ??
      parseJsonStrict<unknown>(extractJsonObject(response.content)).data;
    if (!candidate) {
      logger.error("Competitor synthesis returned non-parseable JSON.", {
        attempt,
        content_length: response.content.length,
        content_preview: response.content.slice(0, 200),
      });
      continue;
    }

    const parsed = competitorSynthesisSchema.safeParse(candidate);
    if (parsed.success) {
      logger.info("Competitor synthesis validated successfully.", {
        module: "competitorSynthesis",
        attempts_used: attempt,
        max_attempts: maxAttempts,
        status: "success",
      });
      return parsed.data;
    }

    logger.error("Competitor synthesis returned schema-invalid JSON.", {
      attempt,
      issue_count: parsed.error.issues.length,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    });
  }

  logger.error("Competitor synthesis validation exhausted retries.", {
    module: "competitorSynthesis",
    attempts_used: maxAttempts,
    max_attempts: maxAttempts,
    status: "failed",
  });

  throw new Error("invalid_competitor_synthesis_schema");
}
