import { z } from "zod";

const CONFIDENCE_PERCENT_PATTERN = /^(?:100(?:\.0+)?|[0-9]{1,2}(?:\.\d+)?)%$/;

export const rewriteConfidenceSchema = z
  .string()
  .trim()
  .regex(
    CONFIDENCE_PERCENT_PATTERN,
    "Confidence must be a percentage between 0% and 100%.",
  );

export type RewriteConfidence = z.infer<typeof rewriteConfidenceSchema>;
type ParsedSection = { title: string; body: string };

function extractLabeledLine(text: string, label: string): string | null {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*:\\s*(.+)$`,
      "gim",
    ),
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*-\\s*(.+)$`,
      "gim",
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value.length > 0) {
        return value;
      }
    }
  }

  return null;
}

function normalizeConfidence(value: string): string {
  const compact = value.replace(/\s+/g, "").trim();
  return compact;
}

export function parseRewriteConfidenceFromText(
  text: string,
): RewriteConfidence | null {
  const raw =
    extractLabeledLine(text, "Confidence") ??
    extractLabeledLine(text, "Confidence level");
  if (!raw) {
    return null;
  }

  const parsed = rewriteConfidenceSchema.safeParse(normalizeConfidence(raw));
  return parsed.success ? parsed.data : null;
}

function splitSections(markdown: string): ParsedSection[] {
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const sections: ParsedSection[] = [];
  let currentTitle = "Untitled";
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (body.length > 0) {
      sections.push({ title: currentTitle, body });
    }
    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const numberedHeadingMatch = line.match(/^\d+\)\s+(.+)$/);
    const title = headingMatch?.[1] ?? numberedHeadingMatch?.[1] ?? null;
    if (title) {
      flush();
      currentTitle = title.trim();
      continue;
    }
    currentBody.push(line);
  }

  flush();
  return sections;
}

export function parseRewriteConfidenceFromTrustedSections(
  text: string,
): RewriteConfidence | null {
  const trusted = new Set([
    "strategy summary",
    "shift metrics",
    "metrics addendum",
  ]);

  const sections = splitSections(text);
  const trustedContent = sections
    .filter((section) => trusted.has(section.title.toLowerCase()))
    .map((section) => section.body)
    .join("\n\n")
    .trim();

  if (trustedContent.length === 0) {
    return null;
  }

  return parseRewriteConfidenceFromText(trustedContent);
}
