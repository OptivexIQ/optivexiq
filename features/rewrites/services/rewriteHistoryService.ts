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
  promptVersion: number;
  systemTemplateVersion: number;
  modelTemperature: number;
  deltaMetrics: Record<string, unknown> | null;
  tokensInput: number;
  tokensOutput: number;
  costCents: number;
};

type PersistedLineage = {
  experimentGroupId: string;
  parentRequestRef: string | null;
  versionNumber: number;
  controlRequestRef: string | null;
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

function toPersistedHypothesis(input: RewriteGenerateRequestValues) {
  return {
    hypothesis_type: input.hypothesis.type,
    controlled_variables: input.hypothesis.controlledVariables,
    treatment_variables: input.hypothesis.treatmentVariables,
    success_criteria: input.hypothesis.successCriteria.trim(),
    minimum_delta_level: input.hypothesis.minimumDeltaLevel,
  };
}

export function generateRewriteRequestRef() {
  const timestamp = Date.now();
  const randomSuffix = randomInt(0, 1000).toString().padStart(3, "0");
  return `RW-${timestamp}-${randomSuffix}`;
}

function buildControlRequestRef(treatmentRequestRef: string) {
  return `${treatmentRequestRef}-control`;
}

function buildControlOutputMarkdown(input: RewriteGenerateRequestValues) {
  const lines: string[] = [];
  lines.push("## Original Input (Control)");
  if (input.websiteUrl?.trim()) {
    lines.push(`- URL: ${input.websiteUrl.trim()}`);
  }
  lines.push("");
  if (input.content?.trim()) {
    lines.push(input.content.trim());
  } else {
    lines.push(
      "_No pasted source content provided for this control baseline._",
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
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
        controlRequestRef: string | null;
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
        controlRequestRef: null,
      };
    }

    const { data, error } = await supabase
      .from("rewrite_generations")
      .select("experiment_group_id, version_number, control_request_ref")
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
        controlRequestRef: null,
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
        controlRequestRef: null,
      };
    }

    return {
      experimentGroupId: data.experiment_group_id as string,
      parentRequestRef,
      versionNumber: Math.max(1, Number(data.version_number ?? 1) + 1),
      controlRequestRef:
        typeof data.control_request_ref === "string" &&
        data.control_request_ref.trim().length > 0
          ? data.control_request_ref.trim()
          : null,
    };
  };

  const lineage = await resolveLineage();
  const controlRequestRef =
    lineage.controlRequestRef ??
    (lineage.parentRequestRef ? null : buildControlRequestRef(params.requestRef));

  if (controlRequestRef && !lineage.parentRequestRef) {
    const controlIdempotencyKey = `${params.input.idempotencyKey}:control`;
    const { error: controlError } = await supabase.from("rewrite_generations").insert({
      user_id: params.userId,
      request_id: `${params.requestId}:control`,
      request_ref: controlRequestRef,
      idempotency_key: controlIdempotencyKey,
      experiment_group_id: lineage.experimentGroupId,
      parent_request_ref: null,
      version_number: 0,
      is_control: true,
      control_request_ref: controlRequestRef,
      rewrite_type: params.input.rewriteType,
      website_url: normalizeNullable(params.input.websiteUrl),
      notes: toPersistedNotes(params.input),
      strategy_context: toPersistedStrategyContext(params.input),
      ...toPersistedHypothesis(params.input),
      source_content: normalizeNullable(params.input.content),
      output_markdown: buildControlOutputMarkdown(params.input),
      rewrite_output_schema_version: 1,
      prompt_version: Math.max(1, Math.floor(params.promptVersion)),
      system_template_version: Math.max(
        1,
        Math.floor(params.systemTemplateVersion),
      ),
      model_temperature: 0,
      delta_metrics: null,
      model: "control_baseline",
      tokens_input: 0,
      tokens_output: 0,
      cost_cents: 0,
    });

    if (controlError && controlError.code !== "23505") {
      logger.error("Failed to persist control baseline rewrite generation.", controlError, {
        user_id: params.userId,
        request_id: params.requestId,
        request_ref: controlRequestRef,
      });
      return { ok: false, error: controlError.message };
    }
  }

  const { error } = await supabase.from("rewrite_generations").insert({
    user_id: params.userId,
    request_id: params.requestId,
    request_ref: params.requestRef,
    idempotency_key: params.input.idempotencyKey,
    experiment_group_id: lineage.experimentGroupId,
    parent_request_ref: lineage.parentRequestRef,
    version_number: lineage.versionNumber,
    is_control: false,
    control_request_ref: controlRequestRef,
    rewrite_type: params.input.rewriteType,
    website_url: normalizeNullable(params.input.websiteUrl),
    notes: toPersistedNotes(params.input),
    strategy_context: toPersistedStrategyContext(params.input),
    ...toPersistedHypothesis(params.input),
    source_content: normalizeNullable(params.input.content),
    output_markdown: params.outputMarkdown,
    rewrite_output_schema_version: 1,
    prompt_version: Math.max(1, Math.floor(params.promptVersion)),
    system_template_version: Math.max(
      1,
      Math.floor(params.systemTemplateVersion),
    ),
    model_temperature: Math.max(0, Math.min(2, params.modelTemperature)),
    delta_metrics: params.deltaMetrics,
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
            controlRequestRef,
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
      controlRequestRef,
    },
  };
}
