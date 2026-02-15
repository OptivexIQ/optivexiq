"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpenAIRequest } from "@/features/ai/client/openaiClient";
import { RuntimeClientConfig } from "@/lib/config/runtime.client";
import { isHttpError } from "@/lib/api/httpClient";
import { streamClient } from "@/lib/api/streamClient";

type GeneratePayload = {
  model?: OpenAIRequest["model"];
  messages: OpenAIRequest["messages"];
  temperature?: OpenAIRequest["temperature"];
  maxTokens?: OpenAIRequest["maxTokens"];
};

type UseStreamingResult = {
  start: (payload: GeneratePayload) => Promise<void>;
  stop: () => void;
  isStreaming: boolean;
  partialContent: string;
  error: string | null;
};

export function useStreaming(): UseStreamingResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialContent, setPartialContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const mockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      if (mockTimerRef.current) {
        clearInterval(mockTimerRef.current);
        mockTimerRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (mockTimerRef.current) {
      clearInterval(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    if (isMountedRef.current) {
      setIsStreaming(false);
    }
  }, []);

  const start = useCallback(async (payload: GeneratePayload) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (isMountedRef.current) {
      setIsStreaming(true);
      setPartialContent("");
      setError(null);
    }

    try {
      if (RuntimeClientConfig.useMockData) {
        const mockText =
          "Mock streaming enabled. This is a simulated response for preview.";
        let index = 0;

        mockTimerRef.current = setInterval(() => {
          if (controller.signal.aborted || !isMountedRef.current) {
            if (mockTimerRef.current) {
              clearInterval(mockTimerRef.current);
              mockTimerRef.current = null;
            }
            return;
          }

          const nextChunk = mockText.slice(index, index + 12);
          index += 12;
          if (nextChunk) {
            setPartialContent((prev) => prev + nextChunk);
          }

          if (index >= mockText.length) {
            if (mockTimerRef.current) {
              clearInterval(mockTimerRef.current);
              mockTimerRef.current = null;
            }
            setIsStreaming(false);
          }
        }, 80);

        return;
      }

      const response = await streamClient("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.body) {
        if (isMountedRef.current) {
          setError("Empty response body.");
          setIsStreaming(false);
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      try {
        while (!done) {
          const result = await reader.read();
          done = result.done;
          if (result.value) {
            const chunk = decoder.decode(result.value, { stream: !done });
            if (chunk && isMountedRef.current) {
              setPartialContent((prev) => prev + chunk);
            }
          }
        }
      } finally {
        await reader.cancel().catch(() => null);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }

      if (isMountedRef.current) {
        setError(
          isHttpError(err)
            ? err.message
            : err instanceof Error
              ? err.message
              : "Streaming failed.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsStreaming(false);
      }
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  return { start, stop, isStreaming, partialContent, error };
}
