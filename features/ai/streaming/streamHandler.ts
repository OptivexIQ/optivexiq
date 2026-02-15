import type OpenAI from "openai";

export async function* streamTextChunks(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
) {
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}
