import {
  runChatCompletion,
  streamChatCompletion,
  type OpenAIRequest,
} from "@/features/ai/client/openaiClient";
import { streamTextChunks } from "@/features/ai/streaming/streamHandler";
import { logger } from "@/lib/logger";
import { estimateTokens } from "@/features/ai/client/tokenEstimator";
import { estimateCost } from "@/features/ai/cost/costTracker";
import {
  finalizeGenerateUsage,
  incrementRewrites,
  reserveGenerateUsage,
  rollbackGenerateUsage,
} from "@/features/usage/services/usageTracker";
import { enqueueUsageFinalizationReconciliation } from "@/features/usage/services/usageFinalizationReconciliationService";
import { emitOperationalAlert } from "@/lib/ops/criticalAlertService";
import { errorResponse } from "@/lib/api/errorResponse";
import type { NextRequest } from "next/server";
import { rewriteGenerateRequestSchema } from "@/features/rewrites/validators/rewritesSchema";
import {
  buildRewriteOpenAIRequest,
  REWRITE_PROMPT_VERSION,
  REWRITE_SYSTEM_TEMPLATE_VERSION,
  buildRewriteShiftStatsRepairRequest,
} from "@/features/rewrites/services/rewritesService";
import {
  generateRewriteRequestRef,
  saveRewriteRecord,
} from "@/features/rewrites/services/rewriteHistoryService";
import { getRewriteHistoryByIdempotencyKeyForUser } from "@/features/rewrites/services/rewriteHistoryReadService";
import type { RewriteGenerateRequestValues } from "@/features/rewrites/validators/rewritesSchema";
import {
  formatRewriteShiftStatsBlock,
  parseRewriteShiftStatsFromText,
  type RewriteShiftStats,
} from "@/features/rewrites/validators/rewriteShiftStatsSchema";
import {
  parseRewriteConfidenceFromTrustedSections,
  type RewriteConfidence,
} from "@/features/rewrites/validators/rewriteConfidenceSchema";
import {
  parseRewriteStructuredOutputFromMarkdown,
  REWRITE_OUTPUT_SCHEMA_VERSION,
} from "@/features/rewrites/validators/rewriteStructuredOutputSchema";
import { emitRewriteTelemetryEvent } from "@/features/rewrites/services/rewriteTelemetryService";

const DEFAULT_MODEL = "gpt-4o-mini";
const FINALIZATION_MAX_ATTEMPTS = 3;
const REWRITE_PERSIST_MAX_ATTEMPTS = 3;

type RewriteDeltaMetrics = {
  lexical_similarity: number;
  headline_changed: boolean;
  cta_changed: boolean;
  structure_changed: boolean;
  delta_level: "light" | "moderate" | "strong";
};

function buildHypothesisTelemetryMetadata(
  rewriteInput: RewriteGenerateRequestValues | null | undefined,
) {
  if (!rewriteInput) {
    return {};
  }
  return {
    hypothesis_type: rewriteInput.hypothesis.type,
    minimum_delta_level: rewriteInput.hypothesis.minimumDeltaLevel,
    controlled_variables: rewriteInput.hypothesis.controlledVariables,
    treatment_variables: rewriteInput.hypothesis.treatmentVariables,
    controlled_variables_count: rewriteInput.hypothesis.controlledVariables.length,
    treatment_variables_count: rewriteInput.hypothesis.treatmentVariables.length,
  };
}

type GeneratePayload = {
  model?: string;
  messages?: OpenAIRequest["messages"];
  temperature?: number;
  maxTokens?: number;
};

function parseGeneratePayload(value: unknown): OpenAIRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as GeneratePayload;
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const normalizedMessages = messages
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const item = message as OpenAIRequest["messages"][number];
      if (
        (item.role !== "system" &&
          item.role !== "user" &&
          item.role !== "assistant") ||
        typeof item.content !== "string"
      ) {
        return null;
      }

      return { role: item.role, content: item.content };
    })
    .filter(
      (message): message is OpenAIRequest["messages"][number] =>
        message !== null,
    );

  if (normalizedMessages.length === 0) {
    return null;
  }

  return {
    model: payload.model ?? DEFAULT_MODEL,
    messages: normalizedMessages,
    temperature: payload.temperature,
    maxTokens: payload.maxTokens,
  };
}

async function parseGenerateRequest(
  payload: unknown,
): Promise<{
  request: OpenAIRequest;
  isRewriteRequest: boolean;
  rewriteInput: RewriteGenerateRequestValues | null;
} | null> {
  const rewriteParsed = rewriteGenerateRequestSchema.safeParse(payload);
  if (rewriteParsed.success) {
    return {
      request: await buildRewriteOpenAIRequest(rewriteParsed.data),
      isRewriteRequest: true,
      rewriteInput: rewriteParsed.data,
    };
  }

  const generic = parseGeneratePayload(payload);
  if (!generic) {
    return null;
  }

  return { request: generic, isRewriteRequest: false, rewriteInput: null };
}

async function finalizeGenerateUsageWithRetry(params: {
  userId: string;
  reservationKey: string;
  actualTokens: number;
  actualCostCents: number;
  requestId: string;
}): Promise<{ ok: true; mode: "exact" } | { ok: false }> {
  for (let attempt = 1; attempt <= FINALIZATION_MAX_ATTEMPTS; attempt += 1) {
    const exact = await finalizeGenerateUsage({
      userId: params.userId,
      reservationKey: params.reservationKey,
      actualTokens: params.actualTokens,
      actualCostCents: params.actualCostCents,
    });
    if (exact.ok) {
      return { ok: true, mode: "exact" };
    }
    logger.error("Generate usage exact finalization attempt failed.", {
      request_id: params.requestId,
      reservation_key: params.reservationKey,
      attempt,
      max_attempts: FINALIZATION_MAX_ATTEMPTS,
      error: exact.error,
    });
  }

  return { ok: false };
}

async function saveRewriteRecordWithRetry(
  params: Parameters<typeof saveRewriteRecord>[0],
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
  let lastError = "unknown_error";

  for (let attempt = 1; attempt <= REWRITE_PERSIST_MAX_ATTEMPTS; attempt += 1) {
    const result = await saveRewriteRecord(params);
    if (result.ok) {
      return { ok: true, lineage: result.lineage };
    }

    lastError = result.error;
    logger.error("Rewrite record persist attempt failed.", {
      request_id: params.requestId,
      user_id: params.userId,
      request_ref: params.requestRef,
      attempt,
      max_attempts: REWRITE_PERSIST_MAX_ATTEMPTS,
      error: result.error,
    });
  }

  return { ok: false, error: lastError };
}

async function ensureRewriteShiftStats(params: {
  output: string;
  rewriteInput: RewriteGenerateRequestValues;
  requestId: string;
  userId: string;
  requestRef: string | null;
}): Promise<{
  stats: RewriteShiftStats | null;
  confidence: RewriteConfidence | null;
  appendedBlock: string;
  extraInputTokens: number;
  extraOutputTokens: number;
  extraCostCents: number;
}> {
  const parsed = parseRewriteShiftStatsFromText(params.output);
  const confidence = parseRewriteConfidenceFromTrustedSections(params.output);
  const missingStats = !parsed;
  const missingConfidence = !confidence;

  if (!missingStats && !missingConfidence) {
    return {
      stats: parsed,
      confidence,
      appendedBlock: "",
      extraInputTokens: 0,
      extraOutputTokens: 0,
      extraCostCents: 0,
    };
  }

  logger.warn("rewrite.shift_stats.missing", {
    requestId: params.requestId,
    userId: params.userId,
    requestRef: params.requestRef,
    rewriteType: params.rewriteInput.rewriteType,
  });

  let accumulatedInputTokens = 0;
  let accumulatedOutputTokens = 0;
  let accumulatedCostCents = 0;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const repairRequest = buildRewriteShiftStatsRepairRequest({
        rewriteType: params.rewriteInput.rewriteType,
        sourceContent: params.rewriteInput.content,
        outputMarkdown: params.output,
      });
      const repairResponse = await runChatCompletion(repairRequest);
      accumulatedInputTokens += repairResponse.promptTokens;
      accumulatedOutputTokens += repairResponse.completionTokens;
      accumulatedCostCents += Math.round(repairResponse.estimatedCostUsd * 100);

      const repairedStats = parseRewriteShiftStatsFromText(repairResponse.content);
      const repairedConfidence = parseRewriteConfidenceFromTrustedSections(
        repairResponse.content,
      );
      if ((missingStats && !repairedStats) || (missingConfidence && !repairedConfidence)) {
        logger.warn("rewrite.shift_stats.repair_invalid_attempt", {
          requestId: params.requestId,
          userId: params.userId,
          requestRef: params.requestRef,
          rewriteType: params.rewriteInput.rewriteType,
          attempt,
          maxAttempts: 2,
        });
        continue;
      }

      logger.info("rewrite.shift_stats.repaired", {
        requestId: params.requestId,
        userId: params.userId,
        requestRef: params.requestRef,
        rewriteType: params.rewriteInput.rewriteType,
        model: repairResponse.model,
        attempt,
        missingStats,
        missingConfidence,
      });

      const resolvedStats = parsed ?? repairedStats;
      const resolvedConfidence = confidence ?? repairedConfidence;
      const appendLines: string[] = [];
      if (missingStats && repairedStats) {
        appendLines.push(formatRewriteShiftStatsBlock(repairedStats).trimEnd());
      }
      if (missingConfidence && resolvedConfidence) {
        if (missingStats) {
          appendLines.push(`- Confidence: ${resolvedConfidence}`);
        } else {
          appendLines.push("### Metrics Addendum");
          appendLines.push(`- Confidence: ${resolvedConfidence}`);
        }
      }

      return {
        stats: resolvedStats,
        confidence: resolvedConfidence,
        appendedBlock: appendLines.length > 0 ? `\n\n${appendLines.join("\n")}\n` : "",
        extraInputTokens: accumulatedInputTokens,
        extraOutputTokens: accumulatedOutputTokens,
        extraCostCents: accumulatedCostCents,
      };
    } catch (error) {
      logger.error("rewrite.shift_stats.repair_failed_attempt", error, {
        requestId: params.requestId,
        userId: params.userId,
        requestRef: params.requestRef,
        rewriteType: params.rewriteInput.rewriteType,
        attempt,
        maxAttempts: 2,
      });
    }
  }

  logger.error("rewrite.shift_stats.repair_exhausted", {
    requestId: params.requestId,
    userId: params.userId,
    requestRef: params.requestRef,
    rewriteType: params.rewriteInput.rewriteType,
  });
  return {
    stats: null,
    confidence: null,
    appendedBlock: "",
    extraInputTokens: accumulatedInputTokens,
    extraOutputTokens: accumulatedOutputTokens,
    extraCostCents: accumulatedCostCents,
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_>#~\-]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokenSet(value: string) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token.length >= 3),
  );
}

function computeLexicalSimilarity(source: string, treatment: string) {
  const sourceSet = toTokenSet(source);
  const treatmentSet = toTokenSet(treatment);
  if (sourceSet.size === 0 || treatmentSet.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of sourceSet) {
    if (treatmentSet.has(token)) {
      overlap += 1;
    }
  }

  const denominator = sourceSet.size + treatmentSet.size;
  if (denominator === 0) {
    return 0;
  }

  return (2 * overlap) / denominator;
}

function extractFirstContentLine(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const normalized = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[-*]\s+/, "")
      .trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return "";
}

function extractPrimaryCtaLine(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*(?:[-*]\s+)?(?:\*\*)?Primary CTA(?:\*\*)?\s*:\s*(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function extractStructureSignature(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const markers: string[] = [];
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading?.[1]) {
      markers.push(
        heading[1]
          .toLowerCase()
          .trim()
          .replace(/^\d+\s*[\).\-\:]\s*/, "")
          .replace(/\s+/g, " "),
      );
      continue;
    }
    const label = line.match(/^\s*([A-Za-z][A-Za-z0-9 /&-]{1,48})\s*:\s+/);
    if (label?.[1]) {
      markers.push(label[1].toLowerCase().trim().replace(/\s+/g, " "));
    }
  }
  return markers.join("|");
}

function clamp01(value: number) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function computeRewriteDeltaMetrics(params: {
  sourceContent: string;
  proposedRewrite: string;
  minimumDeltaLevel: "light" | "moderate" | "strong";
}): RewriteDeltaMetrics {
  const lexicalSimilarity = clamp01(
    computeLexicalSimilarity(params.sourceContent, params.proposedRewrite),
  );
  const sourceHeadline = normalizeText(extractFirstContentLine(params.sourceContent));
  const rewriteHeadline = normalizeText(extractFirstContentLine(params.proposedRewrite));
  const sourceCta = normalizeText(extractPrimaryCtaLine(params.sourceContent));
  const rewriteCta = normalizeText(extractPrimaryCtaLine(params.proposedRewrite));
  const sourceStructure = extractStructureSignature(params.sourceContent);
  const rewriteStructure = extractStructureSignature(params.proposedRewrite);

  return {
    lexical_similarity: Number(lexicalSimilarity.toFixed(4)),
    headline_changed:
      sourceHeadline.length > 0 &&
      rewriteHeadline.length > 0 &&
      sourceHeadline !== rewriteHeadline,
    cta_changed:
      sourceCta.length > 0 &&
      rewriteCta.length > 0 &&
      sourceCta !== rewriteCta,
    structure_changed:
      sourceStructure.length > 0 &&
      rewriteStructure.length > 0 &&
      sourceStructure !== rewriteStructure,
    delta_level: params.minimumDeltaLevel,
  };
}

function maxLexicalSimilarityForDelta(level: "light" | "moderate" | "strong") {
  if (level === "strong") {
    return 0.55;
  }
  if (level === "moderate") {
    return 0.7;
  }
  return 0.85;
}

function buildIncreaseVariationRetryRequest(params: {
  baseRequest: OpenAIRequest;
  currentOutput: string;
  minimumDeltaLevel: "light" | "moderate" | "strong";
  lexicalSimilarity: number;
}): OpenAIRequest {
  const stricter = [
    "Retry instruction: increase variation.",
    `Minimum delta: ${params.minimumDeltaLevel}.`,
    `Current lexical similarity is too high (${(params.lexicalSimilarity * 100).toFixed(1)}%).`,
    "Avoid close paraphrase, use new framing, and materially rewrite headlines/CTAs and section language while preserving factual truth.",
    "Return the full response again in the required six-section format.",
  ].join("\n");

  return {
    ...params.baseRequest,
    temperature:
      typeof params.baseRequest.temperature === "number"
        ? Math.min(0.85, params.baseRequest.temperature + 0.1)
        : 0.55,
    messages: [
      ...params.baseRequest.messages,
      {
        role: "user",
        content: [
          "Previous output:",
          params.currentOutput,
          "",
          stricter,
        ].join("\n"),
      },
    ],
  };
}

export async function handleGenerateStream(params: {
  request: NextRequest;
  userId: string;
  requestId: string;
  routePath?: string;
  allowRewriteRequests?: boolean;
  requireRewriteRequest?: boolean;
}): Promise<Response> {
  const {
    request,
    userId,
    requestId,
    routePath = "/api/generate",
    allowRewriteRequests = true,
    requireRewriteRequest = false,
  } = params;
  const startTime = Date.now();
  const body = await request.json().catch(() => null);
  let parsedRequest: Awaited<ReturnType<typeof parseGenerateRequest>> | null =
    null;

  if (requireRewriteRequest) {
    const rewriteParsed = rewriteGenerateRequestSchema.safeParse(body);
    if (!rewriteParsed.success) {
      return errorResponse("invalid_payload", "Invalid rewrite payload.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }
    parsedRequest = {
      request: await buildRewriteOpenAIRequest(rewriteParsed.data),
      isRewriteRequest: true,
      rewriteInput: rewriteParsed.data,
    };
  } else {
    if (!allowRewriteRequests) {
      const rewriteParsed = rewriteGenerateRequestSchema.safeParse(body);
      if (rewriteParsed.success) {
        return errorResponse(
          "invalid_payload",
          "Rewrite requests now use /api/rewrites/generate.",
          400,
          {
            requestId,
            headers: { "x-request-id": requestId },
          },
        );
      }
    }
    parsedRequest = await parseGenerateRequest(body);
  }

  if (!parsedRequest) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  const { request: generateRequest, isRewriteRequest, rewriteInput } = parsedRequest;

  if (isRewriteRequest && rewriteInput) {
    const existing = await getRewriteHistoryByIdempotencyKeyForUser(
      userId,
      rewriteInput.idempotencyKey,
    );
    if (existing) {
      logger.info("rewrite.generate.idempotent_replay", {
        requestId,
        userId,
        requestRef: existing.requestRef,
        idempotencyKey: rewriteInput.idempotencyKey,
      });
      return new Response(existing.outputMarkdown, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "x-request-id": requestId,
          "x-rewrite-ref": existing.requestRef,
          "x-rewrite-created-at": existing.createdAt,
          "x-idempotent-replay": "true",
        },
      });
    }
  }

  const rewriteRef = isRewriteRequest ? generateRewriteRequestRef() : null;
  const rewriteCreatedAt = isRewriteRequest ? new Date().toISOString() : null;
  let completedExperimentGroupId: string | null = null;
  let completedVersionNumber: number | null = null;

  logger.info("AI stream requested.", {
    requestId,
    userId,
    model: generateRequest.model,
  });
  if (isRewriteRequest) {
    logger.info("rewrite.generate.started", {
      requestId,
      userId,
      requestRef: rewriteRef,
      experimentGroupId: null,
      rewriteType: rewriteInput?.rewriteType ?? null,
      model: generateRequest.model,
    });
    void emitRewriteTelemetryEvent({
      userId,
      requestId,
      eventType: "rewrite_started",
      requestRef: rewriteRef,
      experimentGroupId: null,
      route: routePath,
      metadata: {
        rewrite_type: rewriteInput?.rewriteType ?? null,
        model: generateRequest.model,
        ...buildHypothesisTelemetryMetadata(rewriteInput),
      },
    });
  }

  const estimatedInputTokens = estimateTokens(generateRequest);
  const estimatedOutputTokens =
    typeof generateRequest.maxTokens === "number" && generateRequest.maxTokens > 0
      ? Math.floor(generateRequest.maxTokens)
      : 2048;
  const reservedTokens = estimatedInputTokens + estimatedOutputTokens;
  const reservedCostCents = Math.round(
    estimateCost({
      model: generateRequest.model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
    }) * 100,
  );

  const reserved = await reserveGenerateUsage({
    userId,
    reservationKey: requestId,
    reservedTokens,
    reservedCostCents,
  });
  if (!reserved.ok) {
    return errorResponse("forbidden", "Token limit reached.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
      details: {
        quota_code: "TOKEN_QUOTA_EXCEEDED",
      },
    });
  }

  if (isRewriteRequest && rewriteInput && rewriteRef && rewriteCreatedAt) {
    try {
      let workingRequest = generateRequest;
      let output = "";
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCostCents = 0;
      let deltaMetrics: RewriteDeltaMetrics | null = null;
      let usedModel = generateRequest.model;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const completion = await runChatCompletion(workingRequest);
        usedModel = completion.model;
        totalInputTokens += completion.promptTokens;
        totalOutputTokens += completion.completionTokens;
        totalCostCents += Math.round(completion.estimatedCostUsd * 100);

        let candidateOutput = completion.content;
        const shiftStatsResult = await ensureRewriteShiftStats({
          output: candidateOutput,
          rewriteInput,
          requestId,
          userId,
          requestRef: rewriteRef,
        });
        totalInputTokens += shiftStatsResult.extraInputTokens;
        totalOutputTokens += shiftStatsResult.extraOutputTokens;
        totalCostCents += shiftStatsResult.extraCostCents;

        if (!shiftStatsResult.stats || !shiftStatsResult.confidence) {
          throw new Error("Rewrite output failed metrics contract validation.");
        }

        if (shiftStatsResult.appendedBlock.length > 0) {
          candidateOutput += shiftStatsResult.appendedBlock;
          totalOutputTokens += estimateTokens(shiftStatsResult.appendedBlock);
        }

        const structured = parseRewriteStructuredOutputFromMarkdown(candidateOutput);
        if (!structured) {
          throw new Error("Rewrite output failed structured contract validation.");
        }

        const proposedRewriteForMetrics = structured.proposedRewrite;
        const computedMetrics = computeRewriteDeltaMetrics({
          sourceContent: rewriteInput.content ?? "",
          proposedRewrite: proposedRewriteForMetrics,
          minimumDeltaLevel: rewriteInput.hypothesis.minimumDeltaLevel,
        });
        const threshold = maxLexicalSimilarityForDelta(
          rewriteInput.hypothesis.minimumDeltaLevel,
        );
        if (computedMetrics.lexical_similarity <= threshold) {
          output = candidateOutput;
          deltaMetrics = computedMetrics;
          break;
        }

        if (attempt === 1) {
          workingRequest = buildIncreaseVariationRetryRequest({
            baseRequest: generateRequest,
            currentOutput: candidateOutput,
            minimumDeltaLevel: rewriteInput.hypothesis.minimumDeltaLevel,
            lexicalSimilarity: computedMetrics.lexical_similarity,
          });
          continue;
        }

        throw new Error(
          "We could not produce a meaningful variation for this hypothesis. Try increasing delta or changing treatment variables.",
        );
      }

      if (!output || !deltaMetrics) {
        throw new Error("Rewrite generation failed to produce a valid output.");
      }

      const finalizedTokens = Math.min(
        reservedTokens,
        totalInputTokens + totalOutputTokens,
      );
      const finalizedCostCents = Math.min(
        reservedCostCents,
        Math.max(0, totalCostCents),
      );

      const finalization = await finalizeGenerateUsageWithRetry({
        userId,
        reservationKey: requestId,
        actualTokens: finalizedTokens,
        actualCostCents: finalizedCostCents,
        requestId,
      });

      if (!finalization.ok) {
        await enqueueUsageFinalizationReconciliation({
          reservationKey: requestId,
          userId,
          route: routePath,
          exactTokens: finalizedTokens,
          exactCostCents: finalizedCostCents,
          errorMessage: "finalization_failed_after_retries",
        });
        logger.error("AI usage finalization failed after retries.", {
          request_id: requestId,
          user_id: userId,
          reservation_key: requestId,
          charge_state: "reservation_retained",
          finalization_state: "unreconciled",
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          finalized_tokens: finalizedTokens,
          finalized_cost_cents: finalizedCostCents,
        });
        await emitOperationalAlert({
          severity: "critical",
          source: "generate_stream_finalization",
          message:
            "Generate stream finalization failed after retries; reservation retained.",
          context: {
            reservation_key: requestId,
            user_id: userId,
            route: routePath,
            exact_tokens: finalizedTokens,
            exact_cost_cents: finalizedCostCents,
            error: "finalization_failed_after_retries",
          },
        });
        return errorResponse("internal_error", "Unable to finalize usage.", 500, {
          requestId,
          headers: { "x-request-id": requestId },
        });
      }

      const rewriteUsage = await incrementRewrites(userId);
      if (!rewriteUsage.ok) {
        logger.error("Rewrite usage increment failed after rewrite completion.", {
          request_id: requestId,
          user_id: userId,
          error: rewriteUsage.error,
        });
      }

      const persistResult = await saveRewriteRecordWithRetry({
        userId,
        requestId,
        requestRef: rewriteRef,
        input: rewriteInput,
        outputMarkdown: output,
        model: usedModel,
        promptVersion: REWRITE_PROMPT_VERSION,
        systemTemplateVersion: REWRITE_SYSTEM_TEMPLATE_VERSION,
        modelTemperature:
          typeof workingRequest.temperature === "number"
            ? workingRequest.temperature
            : 0.35,
        deltaMetrics,
        tokensInput: totalInputTokens,
        tokensOutput: totalOutputTokens,
        costCents: totalCostCents,
      });

      if (!persistResult.ok) {
        logger.error(
          "Rewrite generation persisted with usage but no history record.",
          {
            request_id: requestId,
            user_id: userId,
            request_ref: rewriteRef,
            error: persistResult.error,
          },
        );
        await emitOperationalAlert({
          severity: "critical",
          source: "rewrite_persistence",
          message:
            "Rewrite completed but history persistence failed after retries.",
          context: {
            request_id: requestId,
            request_ref: rewriteRef,
            user_id: userId,
            rewrite_type: rewriteInput.rewriteType,
            error: persistResult.error,
          },
        });
        void emitRewriteTelemetryEvent({
          userId,
          requestId,
          eventType: "rewrite_failed",
          requestRef: rewriteRef,
          experimentGroupId: null,
          route: routePath,
          latencyMs: Date.now() - startTime,
          reservedTokens,
          actualTokens: finalizedTokens,
          metadata: {
            stage: "persistence",
            rewrite_type: rewriteInput.rewriteType,
          },
        });
      } else {
        completedExperimentGroupId = persistResult.lineage.experimentGroupId;
        completedVersionNumber = persistResult.lineage.versionNumber;
        void emitRewriteTelemetryEvent({
          userId,
          requestId,
          eventType: "rewrite_completed",
          requestRef: rewriteRef,
          experimentGroupId: persistResult.lineage.experimentGroupId,
          route: routePath,
          latencyMs: Date.now() - startTime,
          reservedTokens,
          actualTokens: finalizedTokens,
          metadata: {
            rewrite_type: rewriteInput.rewriteType,
            version_number: persistResult.lineage.versionNumber,
            parent_request_ref: persistResult.lineage.parentRequestRef,
            rewrite_output_schema_version: REWRITE_OUTPUT_SCHEMA_VERSION,
            delta_metrics: deltaMetrics,
          },
        });
      }

      logger.info("rewrite.generate.completed", {
        requestId,
        userId,
        requestRef: rewriteRef,
        experimentGroupId: completedExperimentGroupId,
        rewriteType: rewriteInput.rewriteType,
        rewriteOutputSchemaVersion: REWRITE_OUTPUT_SCHEMA_VERSION,
        versionNumber: completedVersionNumber,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        costCents: totalCostCents,
        durationMs: Date.now() - startTime,
        deltaMetrics,
      });

      return new Response(output, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "x-request-id": requestId,
          "x-rewrite-ref": rewriteRef,
          "x-rewrite-created-at": rewriteCreatedAt,
          "x-rewrite-delta-lexical-similarity": String(
            deltaMetrics.lexical_similarity,
          ),
        },
      });
    } catch (error) {
      logger.error("rewrite.generate.failed", error, {
        requestId,
        userId,
        requestRef: rewriteRef,
        experimentGroupId: null,
        stage: "delta_enforcement",
      });
      void emitRewriteTelemetryEvent({
        userId,
        requestId,
        eventType: "rewrite_failed",
        requestRef: rewriteRef,
        experimentGroupId: null,
        route: routePath,
        metadata: {
          stage: "delta_enforcement",
          rewrite_type: rewriteInput.rewriteType,
          message: error instanceof Error ? error.message : "unknown_error",
          ...buildHypothesisTelemetryMetadata(rewriteInput),
        },
      });
      await rollbackGenerateUsage({
        userId,
        reservationKey: requestId,
      });
      const message =
        error instanceof Error
          ? error.message
          : "Unable to generate rewrite.";
      const isVariationFailure = /meaningful variation/i.test(message);
      return errorResponse(
        isVariationFailure
          ? "conflict"
          : "provider_unavailable",
        message,
        isVariationFailure ? 422 : 500,
        {
        requestId,
        headers: { "x-request-id": requestId },
        },
      );
    }
  }

  let stream: Awaited<ReturnType<typeof streamChatCompletion>>;
  try {
    stream = await streamChatCompletion(generateRequest);
  } catch (error) {
    logger.error("Failed to start AI stream.", error, { requestId });
    if (isRewriteRequest) {
      logger.error("rewrite.generate.failed", error, {
        requestId,
        userId,
        requestRef: rewriteRef,
        experimentGroupId: null,
        stage: "stream_start",
      });
      void emitRewriteTelemetryEvent({
        userId,
        requestId,
        eventType: "rewrite_failed",
        requestRef: rewriteRef,
        experimentGroupId: null,
        route: routePath,
        metadata: {
          stage: "stream_start",
          rewrite_type: rewriteInput?.rewriteType ?? null,
          ...buildHypothesisTelemetryMetadata(rewriteInput),
        },
      });
    }
    await rollbackGenerateUsage({
      userId,
      reservationKey: requestId,
    });
    return errorResponse("provider_unavailable", "AI provider unavailable.", 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const iterator = streamTextChunks(stream)[Symbol.asyncIterator]();
  let firstChunk = "";
  try {
    const first = await iterator.next();
    if (first.done || !first.value) {
      await rollbackGenerateUsage({
        userId,
        reservationKey: requestId,
      });
      return errorResponse("stream_failed", "AI stream failed to start.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }
    firstChunk = first.value;
  } catch (error) {
    logger.error("Failed to prime AI stream.", error, { requestId });
    if (isRewriteRequest) {
      logger.error("rewrite.generate.failed", error, {
        requestId,
        userId,
        requestRef: rewriteRef,
        experimentGroupId: null,
        stage: "stream_prime",
      });
      void emitRewriteTelemetryEvent({
        userId,
        requestId,
        eventType: "rewrite_failed",
        requestRef: rewriteRef,
        experimentGroupId: null,
        route: routePath,
        metadata: {
          stage: "stream_prime",
          rewrite_type: rewriteInput?.rewriteType ?? null,
          ...buildHypothesisTelemetryMetadata(rewriteInput),
        },
      });
    }
    await rollbackGenerateUsage({
      userId,
      reservationKey: requestId,
    });
    return errorResponse("provider_unavailable", "AI provider unavailable.", 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      let closed = false;
      let aborted = false;
      let failed = false;
      let finalized = false;
      let output = firstChunk;
      let outputTokensSoFar = estimateTokens(firstChunk);
      let supplementalInputTokens = 0;
      let supplementalOutputTokens = 0;
      const abortHandler = () => {
        closed = true;
        aborted = true;
        controller.close();
      };

      request.signal?.addEventListener("abort", abortHandler);

      (async () => {
        try {
          controller.enqueue(encoder.encode(firstChunk));
          const remainingChunks = {
            [Symbol.asyncIterator]: () => iterator,
          };

          for await (const chunk of remainingChunks) {
            if (closed) {
              break;
            }
            output += chunk;
            outputTokensSoFar += estimateTokens(chunk);
            controller.enqueue(encoder.encode(chunk));
          }

          if (!closed && isRewriteRequest && rewriteInput) {
            const shiftStatsResult = await ensureRewriteShiftStats({
              output,
              rewriteInput,
              requestId,
              userId,
              requestRef: rewriteRef,
            });
            supplementalInputTokens += shiftStatsResult.extraInputTokens;
            supplementalOutputTokens += shiftStatsResult.extraOutputTokens;
            if (!shiftStatsResult.stats || !shiftStatsResult.confidence) {
              throw new Error(
                "Rewrite output failed metrics contract validation.",
              );
            }
            if (shiftStatsResult.appendedBlock.length > 0) {
              output += shiftStatsResult.appendedBlock;
              outputTokensSoFar += estimateTokens(shiftStatsResult.appendedBlock);
              controller.enqueue(encoder.encode(shiftStatsResult.appendedBlock));
            }

            const structured = parseRewriteStructuredOutputFromMarkdown(output);
            if (!structured) {
              throw new Error(
                "Rewrite output failed structured contract validation.",
              );
            }
          }
        } catch (error) {
          failed = true;
          if (!closed) {
            logger.error("AI stream failed.", error, { requestId });
            const streamError =
              error instanceof Error ? error : new Error("AI stream failed.");
            try {
              controller.error(streamError);
            } catch {
              // Ignore controller errors after close.
            }
          }
        } finally {
          if (!closed) {
            controller.close();
          }
          request.signal?.removeEventListener("abort", abortHandler);

          if (failed || aborted || finalized) {
            if (failed) {
              if (isRewriteRequest) {
                logger.error("rewrite.generate.failed", {
                  requestId,
                  userId,
                  requestRef: rewriteRef,
                  experimentGroupId: null,
                  stage: "stream_runtime",
                });
                void emitRewriteTelemetryEvent({
                  userId,
                  requestId,
                  eventType: "rewrite_failed",
                  requestRef: rewriteRef,
                  experimentGroupId: null,
                  route: routePath,
                  metadata: {
                    stage: "stream_runtime",
                    rewrite_type: rewriteInput?.rewriteType ?? null,
                    ...buildHypothesisTelemetryMetadata(rewriteInput),
                  },
                });
              }
              await rollbackGenerateUsage({
                userId,
                reservationKey: requestId,
              });
              return;
            }

            if (aborted) {
              logger.info("AI stream aborted.", { requestId });
              const inputTokens = estimateTokens(generateRequest);
              const totalInputTokens = inputTokens + supplementalInputTokens;
              const outputTokens = Math.max(0, outputTokensSoFar);
              const totalOutputTokens = outputTokens + supplementalOutputTokens;
              const actualTokens = Math.min(
                reservedTokens,
                totalInputTokens + totalOutputTokens,
              );
              const actualCostCents = Math.min(
                reservedCostCents,
                Math.round(
                  estimateCost({
                    model: generateRequest.model,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                  }) * 100,
                ),
              );

              const abortedFinalization = await finalizeGenerateUsage({
                userId,
                reservationKey: requestId,
                actualTokens,
                actualCostCents,
              });
              if (!abortedFinalization.ok) {
                const errorMessage =
                  abortedFinalization.error ?? "aborted_stream_finalization_failed";
                await enqueueUsageFinalizationReconciliation({
                  reservationKey: requestId,
                  userId,
                  route: routePath,
                  exactTokens: actualTokens,
                  exactCostCents: actualCostCents,
                  errorMessage,
                });
                logger.error("Failed to finalize usage for aborted stream.", {
                  requestId,
                  error: errorMessage,
                  charge_state: "reservation_retained",
                });
                await emitOperationalAlert({
                  severity: "critical",
                  source: "generate_stream_finalization",
                  message: "Aborted stream finalization failed; reservation retained.",
                  context: {
                    reservation_key: requestId,
                    user_id: userId,
                    route: routePath,
                    exact_tokens: actualTokens,
                    exact_cost_cents: actualCostCents,
                    error: errorMessage,
                  },
                });
              }
              return;
            }
            return;
          }

          finalized = true;

          const inputTokens = estimateTokens(generateRequest);
          const totalInputTokens = inputTokens + supplementalInputTokens;
          const outputTokens = estimateTokens(output);
          const totalOutputTokens = outputTokens + supplementalOutputTokens;
          const costUsd = estimateCost({
            model: generateRequest.model,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
          });
          const costCents = Math.round(costUsd * 100);
          const finalizedTokens = Math.min(
            reservedTokens,
            totalInputTokens + totalOutputTokens,
          );
          const finalizedCostCents = Math.min(reservedCostCents, costCents);
          const finalization = await finalizeGenerateUsageWithRetry({
            userId,
            reservationKey: requestId,
            actualTokens: finalizedTokens,
            actualCostCents: finalizedCostCents,
            requestId,
          });

          if (!finalization.ok) {
            await enqueueUsageFinalizationReconciliation({
              reservationKey: requestId,
              userId,
              route: routePath,
              exactTokens: finalizedTokens,
              exactCostCents: finalizedCostCents,
              errorMessage: "finalization_failed_after_retries",
            });
            logger.error("AI usage finalization failed after retries.", {
              request_id: requestId,
              user_id: userId,
              reservation_key: requestId,
              charge_state: "reservation_retained",
              finalization_state: "unreconciled",
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              finalized_tokens: finalizedTokens,
              finalized_cost_cents: finalizedCostCents,
            });
            await emitOperationalAlert({
              severity: "critical",
              source: "generate_stream_finalization",
              message: "Generate stream finalization failed after retries; reservation retained.",
              context: {
                reservation_key: requestId,
                user_id: userId,
                route: routePath,
                exact_tokens: finalizedTokens,
                exact_cost_cents: finalizedCostCents,
                error: "finalization_failed_after_retries",
              },
            });
            return;
          }

          if (isRewriteRequest) {
            const rewriteUsage = await incrementRewrites(userId);
            if (!rewriteUsage.ok) {
              logger.error("Rewrite usage increment failed after stream finalization.", {
                request_id: requestId,
                user_id: userId,
                error: rewriteUsage.error,
              });
            }

            if (rewriteInput && rewriteRef) {
              const persistResult = await saveRewriteRecordWithRetry({
                userId,
                requestId,
                requestRef: rewriteRef,
                input: rewriteInput,
                outputMarkdown: output,
                model: generateRequest.model,
                promptVersion: REWRITE_PROMPT_VERSION,
                systemTemplateVersion: REWRITE_SYSTEM_TEMPLATE_VERSION,
                modelTemperature:
                  typeof generateRequest.temperature === "number"
                    ? generateRequest.temperature
                    : 0.35,
                deltaMetrics: null,
                tokensInput: totalInputTokens,
                tokensOutput: totalOutputTokens,
                costCents,
              });
              if (!persistResult.ok) {
                logger.error("Rewrite generation persisted with usage but no history record.", {
                  request_id: requestId,
                  user_id: userId,
                  request_ref: rewriteRef,
                  error: persistResult.error,
                });
                await emitOperationalAlert({
                  severity: "critical",
                  source: "rewrite_persistence",
                  message:
                    "Rewrite completed but history persistence failed after retries.",
                  context: {
                    request_id: requestId,
                    request_ref: rewriteRef,
                    user_id: userId,
                    rewrite_type: rewriteInput.rewriteType,
                    error: persistResult.error,
                  },
                });
                void emitRewriteTelemetryEvent({
                  userId,
                  requestId,
                  eventType: "rewrite_failed",
                  requestRef: rewriteRef,
                  experimentGroupId: null,
                  route: routePath,
                  latencyMs: Date.now() - startTime,
                  reservedTokens,
                  actualTokens: finalizedTokens,
                  metadata: {
                    stage: "persistence",
                    rewrite_type: rewriteInput.rewriteType,
                    ...buildHypothesisTelemetryMetadata(rewriteInput),
                  },
                });
              } else {
                completedExperimentGroupId =
                  persistResult.lineage.experimentGroupId;
                completedVersionNumber = persistResult.lineage.versionNumber;
                void emitRewriteTelemetryEvent({
                  userId,
                  requestId,
                  eventType: "rewrite_completed",
                  requestRef: rewriteRef,
                  experimentGroupId: persistResult.lineage.experimentGroupId,
                  route: routePath,
                  latencyMs: Date.now() - startTime,
                  reservedTokens,
                  actualTokens: finalizedTokens,
                  metadata: {
                    rewrite_type: rewriteInput.rewriteType,
                    version_number: persistResult.lineage.versionNumber,
                    parent_request_ref: persistResult.lineage.parentRequestRef,
                    rewrite_output_schema_version: REWRITE_OUTPUT_SCHEMA_VERSION,
                    ...buildHypothesisTelemetryMetadata(rewriteInput),
                  },
                });
              }
            }
          }

          logger.info("AI stream finalized.", {
            requestId,
            durationMs: Date.now() - startTime,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            costCents,
            finalizationMode: finalization.mode,
          });
          if (isRewriteRequest) {
            logger.info("rewrite.generate.completed", {
              requestId,
              userId,
              requestRef: rewriteRef,
              experimentGroupId: completedExperimentGroupId,
              rewriteType: rewriteInput?.rewriteType ?? null,
              rewriteOutputSchemaVersion: REWRITE_OUTPUT_SCHEMA_VERSION,
              versionNumber: completedVersionNumber,
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              costCents,
              durationMs: Date.now() - startTime,
            });
          }
        }
      })();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-request-id": requestId,
      ...(rewriteRef ? { "x-rewrite-ref": rewriteRef } : {}),
      ...(rewriteCreatedAt ? { "x-rewrite-created-at": rewriteCreatedAt } : {}),
    },
  });
}
