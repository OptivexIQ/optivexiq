import {
  normalizeErrorCode,
  normalizeErrorMessage,
  type HttpError,
} from "@/lib/api/httpClient";
import type {
  RewriteGenerateRequest,
  RewriteSectionMapResult,
  RewriteStreamResult,
  RewriteStreamOptions,
} from "@/features/rewrites/types/rewrites.types";
import { rewriteGenerateRequestSchema } from "@/features/rewrites/validators/rewritesSchema";
import { rewriteSectionMapRequestSchema } from "@/features/rewrites/validators/rewriteSectionMapSchema";
import { z } from "zod";

const rewriteSectionMapResultSchema = z.object({
  source: z.enum(["deterministic", "ai"]),
  sections: z.array(
    z.object({
      title: z.string().min(1).max(64),
      body: z.string().min(1).max(10000),
    }),
  ),
  warnings: z.array(z.string()).default([]),
  model: z.string().nullable(),
});

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
    requestCreatedAt: response.headers.get("x-rewrite-created-at"),
  };
}

export async function mapRewriteSections(input: {
  rewriteType: RewriteGenerateRequest["rewriteType"];
  requestRef?: string | null;
  content: string;
  signal?: AbortSignal;
}): Promise<RewriteSectionMapResult> {
  const parsed = rewriteSectionMapRequestSchema.safeParse({
    rewriteType: input.rewriteType,
    requestRef: input.requestRef ?? undefined,
    content: input.content,
  });
  if (!parsed.success) {
    throw {
      status: 400,
      message: parsed.error.issues[0]?.message ?? "Invalid section map input.",
    } satisfies HttpError;
  }

  const response = await fetch("/api/rewrites/section-map", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
    signal: input.signal,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw toHttpError(response.status, payload);
  }

  const parsedResponse = rewriteSectionMapResultSchema.safeParse(payload);
  if (!parsedResponse.success) {
    throw {
      status: 500,
      message: "Invalid section map response.",
    } satisfies HttpError;
  }

  return parsedResponse.data as RewriteSectionMapResult;
}
