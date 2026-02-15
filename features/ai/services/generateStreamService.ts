import { streamChatCompletion, type OpenAIRequest } from "@/features/ai/client/openaiClient";
import { streamTextChunks } from "@/features/ai/streaming/streamHandler";
import { logger } from "@/lib/logger";
import { estimateTokens } from "@/features/ai/client/tokenEstimator";
import { estimateCost } from "@/features/ai/cost/costTracker";
import {
  finalizeGenerateUsage,
  reserveGenerateUsage,
  rollbackGenerateUsage,
} from "@/features/usage/services/usageTracker";
import {
  enqueueUsageFinalizationReconciliation,
  markUsageFinalizationReconciled,
} from "@/features/usage/services/usageFinalizationReconciliationService";
import { errorResponse } from "@/lib/api/errorResponse";
import type { NextRequest } from "next/server";

const DEFAULT_MODEL = "gpt-4o-mini";
const FINALIZATION_MAX_ATTEMPTS = 3;

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

async function finalizeGenerateUsageWithRetry(params: {
  userId: string;
  reservationKey: string;
  actualTokens: number;
  actualCostCents: number;
  fallbackTokens: number;
  fallbackCostCents: number;
  requestId: string;
}): Promise<{ ok: true; mode: "exact" | "fallback" } | { ok: false }> {
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

  for (let attempt = 1; attempt <= FINALIZATION_MAX_ATTEMPTS; attempt += 1) {
    const fallback = await finalizeGenerateUsage({
      userId: params.userId,
      reservationKey: params.reservationKey,
      actualTokens: params.fallbackTokens,
      actualCostCents: params.fallbackCostCents,
    });
    if (fallback.ok) {
      return { ok: true, mode: "fallback" };
    }
    logger.error("Generate usage fallback finalization attempt failed.", {
      request_id: params.requestId,
      reservation_key: params.reservationKey,
      attempt,
      max_attempts: FINALIZATION_MAX_ATTEMPTS,
      error: fallback.error,
    });
  }

  return { ok: false };
}

export async function handleGenerateStream(params: {
  request: NextRequest;
  userId: string;
  requestId: string;
}): Promise<Response> {
  const { request, userId, requestId } = params;
  const startTime = Date.now();
  const body = await request.json().catch(() => null);
  const generateRequest = parseGeneratePayload(body);

  if (!generateRequest) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  logger.info("AI stream requested.", {
    requestId,
    userId,
    model: generateRequest.model,
  });

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

  let stream: Awaited<ReturnType<typeof streamChatCompletion>>;
  try {
    stream = await streamChatCompletion(generateRequest);
  } catch (error) {
    logger.error("Failed to start AI stream.", error, { requestId });
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
              await rollbackGenerateUsage({
                userId,
                reservationKey: requestId,
              });
              return;
            }

            if (aborted) {
              logger.info("AI stream aborted.", { requestId });
              const inputTokens = estimateTokens(generateRequest);
              const outputTokens = Math.max(0, outputTokensSoFar);
              const actualTokens = Math.min(
                reservedTokens,
                inputTokens + outputTokens,
              );
              const actualCostCents = Math.min(
                reservedCostCents,
                Math.round(
                  estimateCost({
                    model: generateRequest.model,
                    inputTokens,
                    outputTokens,
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
                const fallback = await finalizeGenerateUsage({
                  userId,
                  reservationKey: requestId,
                  actualTokens: reservedTokens,
                  actualCostCents: reservedCostCents,
                });
                if (!fallback.ok) {
                  await enqueueUsageFinalizationReconciliation({
                    reservationKey: requestId,
                    userId,
                    route: "/api/generate",
                    exactTokens: actualTokens,
                    exactCostCents: actualCostCents,
                    fallbackTokens: reservedTokens,
                    fallbackCostCents: reservedCostCents,
                    errorMessage:
                      fallback.error ??
                      abortedFinalization.error ??
                      "aborted_stream_finalization_failed",
                  });
                  logger.error("Failed to finalize usage for aborted stream.", {
                    requestId,
                    error: fallback.error ?? abortedFinalization.error,
                    charge_state: "reservation_retained",
                  });
                } else {
                  await markUsageFinalizationReconciled(requestId);
                }
              } else {
                await markUsageFinalizationReconciled(requestId);
              }
              return;
            }
            return;
          }

          finalized = true;

          const inputTokens = estimateTokens(generateRequest);
          const outputTokens = estimateTokens(output);
          const costUsd = estimateCost({
            model: generateRequest.model,
            inputTokens,
            outputTokens,
          });
          const costCents = Math.round(costUsd * 100);
          const finalizedTokens = Math.min(reservedTokens, inputTokens + outputTokens);
          const finalizedCostCents = Math.min(reservedCostCents, costCents);
          const finalization = await finalizeGenerateUsageWithRetry({
            userId,
            reservationKey: requestId,
            actualTokens: finalizedTokens,
            actualCostCents: finalizedCostCents,
            fallbackTokens: reservedTokens,
            fallbackCostCents: reservedCostCents,
            requestId,
          });

          if (!finalization.ok) {
            await enqueueUsageFinalizationReconciliation({
              reservationKey: requestId,
              userId,
              route: "/api/generate",
              exactTokens: finalizedTokens,
              exactCostCents: finalizedCostCents,
              fallbackTokens: reservedTokens,
              fallbackCostCents: reservedCostCents,
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
            return;
          }

          await markUsageFinalizationReconciled(requestId);

          logger.info("AI stream finalized.", {
            requestId,
            durationMs: Date.now() - startTime,
            inputTokens,
            outputTokens,
            costCents,
            finalizationMode: finalization.mode,
          });
        }
      })();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "x-request-id": requestId,
    },
  });
}
