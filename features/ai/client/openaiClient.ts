import OpenAI from "openai";
import { OPENAI_API_KEY } from "@/lib/env";
import { estimateTokens } from "@/features/ai/client/tokenEstimator";
import { estimateCost } from "@/features/ai/cost/costTracker";

export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type OpenAIResponse = {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  estimatedCostUsd: number;
};

const defaultModel = "gpt-4o-mini";

function createClient() {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = 250 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export async function runChatCompletion(
  request: OpenAIRequest,
): Promise<OpenAIResponse> {
  const client = createClient();
  const model = request.model || defaultModel;

  const response = await withRetry(() =>
    client.chat.completions.create({
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
    }),
  );

  const content = response.choices[0]?.message?.content ?? "";
  const promptTokens = response.usage?.prompt_tokens ?? estimateTokens(request);
  const completionTokens =
    response.usage?.completion_tokens ?? estimateTokens(content);
  const estimatedCostUsd = estimateCost({
    model,
    inputTokens: promptTokens,
    outputTokens: completionTokens,
  });

  return {
    content,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    model,
    estimatedCostUsd,
  };
}

export async function streamChatCompletion(request: OpenAIRequest) {
  const client = createClient();
  const model = request.model || defaultModel;

  return withRetry(() =>
    client.chat.completions.create({
      model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      stream: true,
    }),
  );
}
