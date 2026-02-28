import { randomInt } from "crypto";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import type { RewriteGenerateRequestValues } from "@/features/rewrites/validators/rewritesSchema";

type SaveRewriteRecordParams = {
  userId: string;
  requestId: string;
  requestRef: string;
  input: RewriteGenerateRequestValues;
  outputMarkdown: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costCents: number;
};

function normalizeNullable(value: string | undefined) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toPersistedNotes(input: RewriteGenerateRequestValues): string | null {
  const userNotes =
    typeof input.notes === "string" ? input.notes.trim() : "";

  const contextLines = input.strategicContext
    ? [
        "Studio context:",
        `- Target: ${input.strategicContext.target === "pricing" ? "Pricing" : "Homepage"}`,
        `- Goal: ${input.strategicContext.goal}`,
        `- ICP: ${input.strategicContext.icp}`,
        `- Differentiation focus: ${input.strategicContext.focus.differentiation ? "On" : "Off"}`,
        `- Objection focus: ${input.strategicContext.focus.objection ? "On" : "Off"}`,
      ]
    : [];

  const strategyLines = input.rewriteStrategy
    ? [
        "Rewrite strategy:",
        `- Tone: ${input.rewriteStrategy.tone}`,
        `- Length: ${input.rewriteStrategy.length}`,
        `- Emphasis: ${
          input.rewriteStrategy.emphasis.length > 0
            ? input.rewriteStrategy.emphasis.join(", ")
            : "none"
        }`,
      ]
    : [];

  const sections = [
    contextLines.length > 0 ? contextLines.join("\n") : "",
    strategyLines.length > 0 ? strategyLines.join("\n") : "",
    userNotes.length > 0 ? `User notes:\n${userNotes}` : "",
  ].filter((item) => item.length > 0);

  if (sections.length === 0) {
    return null;
  }

  return sections.join("\n\n");
}

export function generateRewriteRequestRef() {
  const timestamp = Date.now();
  const randomSuffix = randomInt(0, 1000).toString().padStart(3, "0");
  return `RW-${timestamp}-${randomSuffix}`;
}

export async function saveRewriteRecord(
  params: SaveRewriteRecordParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseAdminClient("worker");
  const { error } = await supabase.from("rewrite_generations").insert({
    user_id: params.userId,
    request_id: params.requestId,
    request_ref: params.requestRef,
    rewrite_type: params.input.rewriteType,
    website_url: normalizeNullable(params.input.websiteUrl),
    notes: toPersistedNotes(params.input),
    source_content: normalizeNullable(params.input.content),
    output_markdown: params.outputMarkdown,
    model: params.model,
    tokens_input: Math.max(0, Math.floor(params.tokensInput)),
    tokens_output: Math.max(0, Math.floor(params.tokensOutput)),
    cost_cents: Math.max(0, Math.floor(params.costCents)),
  });

  if (error) {
    logger.error("Failed to persist rewrite generation.", error, {
      user_id: params.userId,
      request_id: params.requestId,
      request_ref: params.requestRef,
    });
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
