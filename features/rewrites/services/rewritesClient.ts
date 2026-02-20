import {
  normalizeErrorCode,
  normalizeErrorMessage,
  type HttpError,
} from "@/lib/api/httpClient";
import type {
  RewriteGenerateRequest,
  RewriteStreamResult,
  RewriteStreamOptions,
} from "@/features/rewrites/types/rewrites.types";
import { rewriteGenerateRequestSchema } from "@/features/rewrites/validators/rewritesSchema";

function toHttpError(status: number, payload: unknown): HttpError {
  return {
    status,
    message: normalizeErrorMessage(payload, "Rewrite request failed."),
    code: normalizeErrorCode(payload),
  };
}

export async function streamRewrite(
  input: RewriteGenerateRequest,
  options: RewriteStreamOptions = {},
): Promise<RewriteStreamResult> {
  const parsed = rewriteGenerateRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw {
      status: 400,
      message: parsed.error.issues[0]?.message ?? "Invalid rewrite input.",
    } satisfies HttpError;
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: options.signal,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");
    throw toHttpError(response.status, payload);
  }

  if (!response.body) {
    throw { status: 500, message: "Streaming response unavailable." } satisfies HttpError;
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    result += chunk;
    options.onChunk?.(chunk);
  }

  result += decoder.decode();
  return {
    content: result,
    requestId: response.headers.get("x-request-id"),
    requestRef: response.headers.get("x-rewrite-ref"),
  };
}
