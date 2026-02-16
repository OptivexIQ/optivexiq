import { runChatCompletion } from "@/features/ai/client/openaiClient";
import {
  extractJsonObject,
  parseJsonStrict,
} from "@/features/ai/streaming/structuredOutputParser";
import { scrapeAndExtract } from "@/features/conversion-gap/services/gapEngineService";
import type { FreeConversionSnapshot } from "@/features/free-snapshot/types/freeSnapshot.types";
import { freeConversionSnapshotSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";
import { logger } from "@/lib/logger";

type GenerateParams = {
  websiteUrl: string;
  competitorUrls: string[];
  context?: string;
};

type SnapshotGenerationResult = {
  snapshot: FreeConversionSnapshot;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
};

export type CompetitorText = { url: string; text: string };

function buildPrompt(params: {
  websiteUrl: string;
  competitorUrls: string[];
  context?: string;
  websiteText: string;
  competitorTexts: CompetitorText[];
}) {
  const schemaContract = {
    executiveSummary: "string",
    topMessagingGap: "string",
    topObjectionGap: "string",
    clarityScore: 0,
    positioningScore: 0,
    riskEstimate: "string",
    quickWins: ["string"],
  };

  const competitorBlock =
    params.competitorTexts.length === 0
      ? "No competitor content provided."
      : params.competitorTexts
          .map(
            (item, index) =>
              `Competitor ${index + 1} (${item.url}):\n${item.text.slice(0, 6000)}`,
          )
          .join("\n\n");

  return {
    system: [
      "You are a senior SaaS conversion strategist.",
      "Analyze the provided live website content and return strict JSON only.",
      "Do not include markdown, prose, or keys outside the schema.",
      `Schema contract: ${JSON.stringify(schemaContract, null, 2)}`,
      "Scoring rules:",
      "- clarityScore: 0-100 based on message clarity and CTA specificity",
      "- positioningScore: 0-100 based on differentiation strength vs competitors",
      "- quickWins must contain 3 to 5 concrete, short actions",
    ].join("\n"),
    user: [
      `Website URL: ${params.websiteUrl}`,
      `Competitor URLs: ${params.competitorUrls.join(", ") || "none"}`,
      `User context: ${params.context?.trim() || "none"}`,
      "",
      `Website content:\n${params.websiteText.slice(0, 12000)}`,
      "",
      `Competitor content:\n${competitorBlock}`,
      "",
      "Return only JSON that matches the schema contract exactly.",
    ].join("\n"),
  };
}

function parseSnapshot(content: string): FreeConversionSnapshot {
  const strict = parseJsonStrict<unknown>(content);
  const extracted = parseJsonStrict<unknown>(extractJsonObject(content));
  const candidate = strict.data ?? extracted.data;

  if (!candidate) {
    throw new Error("free_snapshot_invalid_json");
  }

  const parsed = freeConversionSnapshotSchema.safeParse(candidate);
  if (!parsed.success) {
    logger.error("Free snapshot schema validation failed.", undefined, {
      issue_count: parsed.error.issues.length,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message,
      })),
    });
    throw new Error("free_snapshot_schema_invalid");
  }

  return parsed.data;
}

export async function scrapeFreeSnapshotWebsiteContent(
  websiteUrl: string,
): Promise<string> {
  const websiteContent = await scrapeAndExtract(websiteUrl);
  return websiteContent.rawText;
}

export async function scrapeFreeSnapshotCompetitorContents(
  competitorUrls: string[],
): Promise<CompetitorText[]> {
  return Promise.all(
    competitorUrls.map(async (url) => {
      const content = await scrapeAndExtract(url);
      return { url, text: content.rawText };
    }),
  );
}

export async function analyzeFreeSnapshotFromInput(params: {
  websiteUrl: string;
  competitorUrls: string[];
  context?: string;
  websiteText: string;
  competitorTexts: CompetitorText[];
}): Promise<SnapshotGenerationResult> {
  const prompt = buildPrompt(params);
  const response = await runChatCompletion({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    temperature: 0.2,
  });

  return {
    snapshot: parseSnapshot(response.content),
    usage: {
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    },
  };
}

export async function generateFreeConversionSnapshot(
  params: GenerateParams,
): Promise<SnapshotGenerationResult> {
  const websiteText = await scrapeFreeSnapshotWebsiteContent(params.websiteUrl);
  const competitorTexts = await scrapeFreeSnapshotCompetitorContents(
    params.competitorUrls,
  );

  return analyzeFreeSnapshotFromInput({
    websiteUrl: params.websiteUrl,
    competitorUrls: params.competitorUrls,
    context: params.context,
    websiteText,
    competitorTexts,
  });
}
