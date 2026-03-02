import { z } from "zod";

export const REWRITE_OUTPUT_SCHEMA_VERSION = 1;

export const rewriteStructuredOutputSchema = z.object({
  strategySummary: z.string().trim().min(1),
  proposedRewrite: z.string().trim().min(1),
  rationale: z.string().trim().min(1),
  implementationChecklist: z.string().trim().min(1),
});

export type RewriteStructuredOutput = z.infer<
  typeof rewriteStructuredOutputSchema
>;

function normalizeHeadingLabel(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
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

  const strategySummary = sections.get("strategy summary")?.join("\n").trim();
  const proposedRewrite = sections.get("proposed rewrite")?.join("\n").trim();
  const rationale = sections
    .get("rationale linked to conversion outcomes")
    ?.join("\n")
    .trim();
  const implementationChecklist = sections
    .get("implementation checklist")
    ?.join("\n")
    .trim();

  const parsed = rewriteStructuredOutputSchema.safeParse({
    strategySummary,
    proposedRewrite,
    rationale,
    implementationChecklist,
  });
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}
