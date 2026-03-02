import { randomInt, randomUUID } from "crypto";
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

type PersistedLineage = {
  experimentGroupId: string;
  parentRequestRef: string | null;
  versionNumber: number;
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
  return userNotes.length > 0 ? userNotes : null;
}

function toPersistedStrategyContext(input: RewriteGenerateRequestValues) {
  return {
    target: input.strategicContext?.target ?? input.rewriteType,
    goal: input.strategicContext?.goal ?? "conversion",
    icp: input.strategicContext?.icp ?? "",
    tone: input.rewriteStrategy?.tone ?? "neutral",
    length: input.rewriteStrategy?.length ?? "standard",
    emphasis: input.rewriteStrategy?.emphasis ?? [],
    constraints: input.rewriteStrategy?.constraints?.trim() ?? "",
    audience: input.rewriteStrategy?.audience?.trim() ?? "",
    focus: {
      differentiation: input.strategicContext?.focus.differentiation ?? true,
      objection: input.strategicContext?.focus.objection ?? false,
    },
    schema_version: 1,
  };
}

export function generateRewriteRequestRef() {
  const timestamp = Date.now();
  const randomSuffix = randomInt(0, 1000).toString().padStart(3, "0");
  return `RW-${timestamp}-${randomSuffix}`;
}

export async function saveRewriteRecord(
  params: SaveRewriteRecordParams,
): Promise<
  | {
      ok: true;
      lineage: {
        experimentGroupId: string;
        versionNumber: number;
        parentRequestRef: string | null;
      };
    }
  | { ok: false; error: string }
> {
  const supabase = createSupabaseAdminClient("worker");

  const resolveLineage = async (): Promise<PersistedLineage> => {
    const parentRequestRef = normalizeNullable(params.input.parentRequestRef);
    if (!parentRequestRef) {
      return {
        experimentGroupId: randomUUID(),
        parentRequestRef: null,
        versionNumber: 1,
      };
    }

    const { data, error } = await supabase
      .from("rewrite_generations")
      .select("experiment_group_id, version_number")
      .eq("user_id", params.userId)
      .eq("request_ref", parentRequestRef)
      .maybeSingle();

    if (error) {
      logger.warn("Failed to resolve parent rewrite lineage; creating new experiment group.", {
        user_id: params.userId,
        request_id: params.requestId,
        request_ref: params.requestRef,
        parent_request_ref: parentRequestRef,
        error: error.message,
      });
      return {
        experimentGroupId: randomUUID(),
        parentRequestRef: null,
        versionNumber: 1,
      };
    }

    if (!data) {
      logger.warn("Parent rewrite reference not found for lineage; creating new experiment group.", {
        user_id: params.userId,
        request_id: params.requestId,
        request_ref: params.requestRef,
        parent_request_ref: parentRequestRef,
      });
      return {
        experimentGroupId: randomUUID(),
        parentRequestRef: null,
        versionNumber: 1,
      };
    }

    return {
      experimentGroupId: data.experiment_group_id as string,
      parentRequestRef,
      versionNumber: Math.max(1, Number(data.version_number ?? 1) + 1),
    };
  };

  const lineage = await resolveLineage();

  const { error } = await supabase.from("rewrite_generations").insert({
    user_id: params.userId,
    request_id: params.requestId,
    request_ref: params.requestRef,
    idempotency_key: params.input.idempotencyKey,
    experiment_group_id: lineage.experimentGroupId,
    parent_request_ref: lineage.parentRequestRef,
    version_number: lineage.versionNumber,
    rewrite_type: params.input.rewriteType,
    website_url: normalizeNullable(params.input.websiteUrl),
    notes: toPersistedNotes(params.input),
    strategy_context: toPersistedStrategyContext(params.input),
    source_content: normalizeNullable(params.input.content),
    output_markdown: params.outputMarkdown,
    rewrite_output_schema_version: 1,
    model: params.model,
    tokens_input: Math.max(0, Math.floor(params.tokensInput)),
    tokens_output: Math.max(0, Math.floor(params.tokensOutput)),
    cost_cents: Math.max(0, Math.floor(params.costCents)),
  });

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("rewrite_generations")
        .select("request_ref")
        .eq("user_id", params.userId)
        .eq("idempotency_key", params.input.idempotencyKey)
        .maybeSingle();
      if (!existingError && existing) {
        logger.warn("Rewrite idempotent duplicate insert ignored.", {
          user_id: params.userId,
          request_id: params.requestId,
          request_ref: params.requestRef,
          existing_request_ref: existing.request_ref,
          idempotency_key: params.input.idempotencyKey,
        });
        return {
          ok: true,
          lineage: {
            experimentGroupId: lineage.experimentGroupId,
            versionNumber: lineage.versionNumber,
            parentRequestRef: lineage.parentRequestRef,
          },
        };
      }
    }

    logger.error("Failed to persist rewrite generation.", error, {
      user_id: params.userId,
      request_id: params.requestId,
      request_ref: params.requestRef,
    });
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    lineage: {
      experimentGroupId: lineage.experimentGroupId,
      versionNumber: lineage.versionNumber,
      parentRequestRef: lineage.parentRequestRef,
    },
  };
}
