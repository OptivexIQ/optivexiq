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
    notes: normalizeNullable(params.input.notes),
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

