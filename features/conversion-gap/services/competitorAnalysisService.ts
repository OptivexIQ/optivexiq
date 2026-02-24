import type {
  CompetitorInsight,
  ExtractedPageContent,
} from "@/features/conversion-gap/types/gap.types";
import { runCompetitorEvidenceExtractionModule } from "@/features/conversion-gap/ai/competitorEvidenceExtractionModule";
import type { ModuleUsage } from "@/features/conversion-gap/services/moduleRuntimeService";

function deriveCompetitorName(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function buildSummary(content: ExtractedPageContent) {
  const summaryParts = [content.headline, content.subheadline].filter(Boolean);
  return summaryParts.join(" - ").trim();
}

export async function analyzeCompetitors(
  competitors: ExtractedPageContent[],
): Promise<{ competitors: CompetitorInsight[]; usage: ModuleUsage }> {
  const analyzed = await Promise.all(
    competitors.map(async (content) => {
      const competitorName = deriveCompetitorName(content.url);
      const extraction = await runCompetitorEvidenceExtractionModule({
        competitorName,
        content,
      });
      return {
        competitor: {
          name: competitorName,
          url: content.url,
          summary:
            extraction.data.coreValuePropositions[0] ??
            buildSummary(content),
          strengths: [
            ...extraction.data.differentiators.slice(0, 3),
            ...extraction.data.proofElements.slice(0, 2),
          ],
          weaknesses: [],
          positioning: extraction.data.positioningClaims.slice(0, 4),
          extraction: extraction.data,
          extracted: content,
        } satisfies CompetitorInsight,
        usage: extraction.usage,
      };
    }),
  );

  const usage = analyzed.reduce(
    (acc, item) => ({
      inputTokens: acc.inputTokens + item.usage.inputTokens,
      outputTokens: acc.outputTokens + item.usage.outputTokens,
    }),
    { inputTokens: 0, outputTokens: 0 },
  );

  return {
    competitors: analyzed.map((item) => item.competitor),
    usage,
  };
}
