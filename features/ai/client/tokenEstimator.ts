import type { OpenAIRequest } from "@/features/ai/client/openaiClient";

const averageCharsPerToken = 4;

export function estimateTokens(input: string | OpenAIRequest) {
  if (typeof input === "string") {
    return Math.ceil(input.length / averageCharsPerToken);
  }

  const messageText = input.messages.map((msg) => msg.content).join(" ");
  return Math.ceil(messageText.length / averageCharsPerToken);
}
