import {
  parseRewriteShiftStatsFromText,
  type RewriteShiftStats,
} from "@/features/rewrites/validators/rewriteShiftStatsSchema";
import {
  parseRewriteConfidenceFromTrustedSections,
  type RewriteConfidence,
} from "@/features/rewrites/validators/rewriteConfidenceSchema";
import { parseRewriteStructuredOutputFromMarkdown } from "@/features/rewrites/validators/rewriteStructuredOutputSchema";

export type RewriteOutputSection = {
  title: string;
  body: string;
};

export type RewriteOutputViewModel = {
  summaryBullets: string[];
  copySections: RewriteOutputSection[];
  rationaleSections: RewriteOutputSection[];
  shiftStats: RewriteShiftStats | null;
  confidence: RewriteConfidence | null;
};

function toSummaryBullets(summaryMarkdown: string): string[] {
  return summaryMarkdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(
      (line) =>
        !/^clarity\s*shift\s*:/i.test(line) &&
        !/^objection\s*shift\s*:/i.test(line) &&
        !/^positioning\s*shift\s*:/i.test(line) &&
        !/^confidence(?:\s*level)?\s*:/i.test(line),
    )
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

function toPlainTextInline(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRewriteSubsections(markdown: string): RewriteOutputSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const sections: RewriteOutputSection[] = [];
  let currentTitle = "Proposed Rewrite";
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (body.length > 0) {
      sections.push({ title: currentTitle, body });
    }
    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,6}\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].trim();
      continue;
    }
    currentBody.push(line);
  }
  flush();

  if (sections.length === 0) {
    return markdown.trim().length > 0
      ? [{ title: "Proposed Rewrite", body: markdown.trim() }]
      : [];
  }

  return sections;
}

export function normalizeRationaleParagraph(raw: string): string {
  const text = toPlainTextInline(raw)
    .replace(/(?:^|\s)[-*]\s+/g, " ")
    .replace(/(?:^|\s)\d+[.)]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) {
    return "";
  }

  const splitSentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentences = splitSentences.length > 0 ? splitSentences : [text];
  const clampedSentences = sentences.slice(0, Math.min(4, sentences.length));
  const built = clampedSentences.join(" ").trim();

  const words = built.split(" ").filter(Boolean);
  if (words.length <= 110) {
    return built;
  }

  const truncated = words.slice(0, 110).join(" ").trim();
  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`;
}

export function buildRewriteOutputViewModel(markdown: string): RewriteOutputViewModel {
  const shiftStats = parseRewriteShiftStatsFromText(markdown);
  const confidence = parseRewriteConfidenceFromTrustedSections(markdown);
  const structured = parseRewriteStructuredOutputFromMarkdown(markdown);

  if (!structured) {
    return {
      summaryBullets: [],
      copySections: [],
      rationaleSections: [],
      shiftStats,
      confidence,
    };
  }

  const rationaleParagraph = normalizeRationaleParagraph(structured.rationale);
  return {
    summaryBullets: toSummaryBullets(structured.strategySummary),
    copySections: splitRewriteSubsections(structured.proposedRewrite),
    rationaleSections:
      rationaleParagraph.length > 0
        ? [{ title: "Rationale", body: rationaleParagraph }]
        : [],
    shiftStats,
    confidence,
  };
}
