"use client";

import { useEffect, useState } from "react";
import { getStatus } from "@/features/status/clients/statusClient";
import type { SystemStatusLevel } from "@/features/status/types/status.types";

export type StatusSummaryState = {
  label: string;
  level: SystemStatusLevel;
  updatedAt: string | null;
  isLoading: boolean;
  isError: boolean;
};

type CachePayload = {
  level: SystemStatusLevel;
  updatedAt: string;
};

const REFRESH_MS = 60_000;
const STALE_MS = 30_000;
const JITTER_MS = 3_000;

let inFlight: Promise<CachePayload> | null = null;
let cache: { data: CachePayload; at: number } | null = null;

function labelFor(level: SystemStatusLevel) {
  if (level === "operational") return "All systems operational";
  if (level === "degraded") return "Some systems degraded";
  if (level === "partial_outage") return "Partial outage";
  return "Major outage";
}

async function fetchStatusSummary(): Promise<CachePayload> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const payload = await getStatus();
    const result = {
      level: payload.overall.status,
      updatedAt: payload.overall.updatedAt,
    } as CachePayload;
    cache = { data: result, at: Date.now() };
    return result;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

function fromCache(): CachePayload | null {
  if (!cache) {
    return null;
  }
  if (Date.now() - cache.at > STALE_MS) {
    return null;
  }
  return cache.data;
}

export function useStatusSummary(): StatusSummaryState {
  const [state, setState] = useState<StatusSummaryState>({
    label: "Checking status...",
    level: "operational",
    updatedAt: null,
    isLoading: true,
    isError: false,
  });

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cached = fromCache();
    if (cached) {
      setState({
        label: labelFor(cached.level),
        level: cached.level,
        updatedAt: cached.updatedAt,
        isLoading: false,
        isError: false,
      });
    }

    function scheduleNext() {
      if (!active) return;
      if (timer) {
        clearTimeout(timer);
      }

      const jitter = Math.floor(Math.random() * JITTER_MS);
      timer = setTimeout(() => {
        void refresh();
      }, REFRESH_MS + jitter);
    }

    async function refresh() {
      if (!active) return;

      if (typeof document !== "undefined" && document.hidden) {
        scheduleNext();
        return;
      }

      setState((current) => ({ ...current, isLoading: !current.updatedAt, isError: false }));

      try {
        const next = await fetchStatusSummary();
        if (!active) return;
        setState({
          label: labelFor(next.level),
          level: next.level,
          updatedAt: next.updatedAt,
          isLoading: false,
          isError: false,
        });
      } catch {
        if (!active) return;
        setState((current) => ({
          ...current,
          isLoading: false,
          isError: true,
        }));
      }

      scheduleNext();
    }

    void refresh();
    const onVisibilityChange = () => {
      if (!active) return;
      if (!document.hidden) {
        void refresh();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, []);

  return state;
}
