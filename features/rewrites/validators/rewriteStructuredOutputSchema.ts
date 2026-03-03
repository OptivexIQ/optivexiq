import { z } from "zod";

export const REWRITE_OUTPUT_SCHEMA_VERSION = 1;

export const rewriteStructuredOutputSchema = z.object({
  experimentSetup: z.string().trim().min(1),
  controlSummary: z.string().trim().min(1),
  treatmentPlan: z.string().trim().min(1),
  proposedRewrite: z.string().trim().min(1),
  changeSummary: z.string().trim().min(1),
  confidenceAndRisk: z.string().trim().min(1),
});

export type RewriteStructuredOutput = z.infer<
  typeof rewriteStructuredOutputSchema
>;

function normalizeHeadingLabel(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/^\d+\s*[\).\-\:]\s*/, "")
    .replace(/\s+/g, " ");

  if (normalized === "confidence and risk") {
    return "confidence & risk";
  }

  return normalized;
}

export function parseRewriteStructuredOutputFromMarkdown(
  markdown: string,
): RewriteStructuredOutput | null {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return null;
  }

  const lines = normalized.split("\n");
  const sections = new Map<string, string[]>();
  let currentHeading: string | null = null;
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentHeading) {
      currentBody = [];
      return;
    }
    const body = currentBody.join("\n").trim();
    if (body.length > 0) {
      sections.set(currentHeading, body.split("\n"));
    }
    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = normalizeHeadingLabel(headingMatch[1]);
      continue;
    }
    currentBody.push(line);
  }
  flush();

  const experimentSetup = sections.get("experiment setup")?.join("\n").trim();
  const controlSummary = sections.get("control summary")?.join("\n").trim();
  const treatmentPlan = sections.get("treatment plan")?.join("\n").trim();
  const proposedRewrite = sections.get("proposed rewrite")?.join("\n").trim();
  const changeSummary = sections
    .get("change summary")
    ?.join("\n")
    .trim();
  const confidenceAndRisk = sections
    .get("confidence & risk")
    ?.join("\n")
    .trim();

  const parsed = rewriteStructuredOutputSchema.safeParse({
    experimentSetup,
    controlSummary,
    treatmentPlan,
    proposedRewrite,
    changeSummary,
    confidenceAndRisk,
  });
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
