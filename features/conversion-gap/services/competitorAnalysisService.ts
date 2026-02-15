import type {
  CompetitorInsight,
  ExtractedPageContent,
} from "@/features/conversion-gap/types/gap.types";

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
): Promise<CompetitorInsight[]> {
  return competitors.map((content) => ({
    name: deriveCompetitorName(content.url),
    url: content.url,
    summary: buildSummary(content),
    strengths: content.headline ? [content.headline] : [],
    weaknesses: [],
    positioning: content.subheadline ? [content.subheadline] : [],
    extracted: content,
  }));
}
