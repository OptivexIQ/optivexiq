"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getFreeSnapshotStatus,
  type FreeSnapshotStatusResponse,
} from "@/features/free-snapshot/services/freeSnapshotClient";
import type {
  FreeSnapshotExecutionStage,
  FreeSnapshotStatus,
} from "@/features/free-snapshot/types/freeSnapshot.types";

export type FreeSnapshotViewState = "form" | "running" | "completed" | "failed";

const STAGE_ORDER: FreeSnapshotExecutionStage[] = [
  "fetching_homepage_content",
  "extracting_positioning_signals",
  "analyzing_competitor_structure",
  "generating_executive_diagnosis",
  "scoring_conversion_gaps",
  "finalizing_snapshot",
];

const STAGE_LABELS: Record<FreeSnapshotExecutionStage, string> = {
  fetching_homepage_content: "Fetching homepage content",
  extracting_positioning_signals: "Extracting positioning signals",
  analyzing_competitor_structure: "Analyzing competitor structure",
  generating_executive_diagnosis: "Generating executive diagnosis",
  scoring_conversion_gaps: "Scoring conversion gaps",
  finalizing_snapshot: "Finalizing snapshot",
};

export type FreeSnapshotProgress = {
  value: number;
  label: string;
  activeStageIndex: number;
};

function resolveFallbackLabel(status: FreeSnapshotStatus | null): string {
  if (status === "queued") {
    return "Queued for secure analysis";
  }
  if (status === "scraping") {
    return "Fetching homepage content";
  }
  if (status === "analyzing") {
    return "Generating executive diagnosis";
  }
  if (status === "generating") {
    return "Finalizing snapshot";
  }
  if (status === "failed") {
    return "Analysis failed";
  }
  if (status === "completed") {
    return "Snapshot completed";
  }
  return "Preparing analysis";
}

export function resolveFreeSnapshotProgress(
  status: FreeSnapshotStatus | null,
  executionStage: FreeSnapshotExecutionStage | null,
): FreeSnapshotProgress {
  if (status === "completed") {
    return { value: 100, label: "Snapshot completed", activeStageIndex: 5 };
  }
  if (status === "failed") {
    return { value: 100, label: "Analysis failed", activeStageIndex: -1 };
  }

  if (executionStage) {
    const index = STAGE_ORDER.indexOf(executionStage);
    const clampedIndex = index >= 0 ? index : 0;
    const progressByStage = [15, 30, 48, 66, 84, 95];
    return {
      value: progressByStage[clampedIndex] ?? 8,
      label: STAGE_LABELS[executionStage] ?? resolveFallbackLabel(status),
      activeStageIndex: clampedIndex,
    };
  }

  if (status === "queued") {
    return { value: 8, label: resolveFallbackLabel(status), activeStageIndex: 0 };
  }
  if (status === "scraping") {
    return { value: 24, label: resolveFallbackLabel(status), activeStageIndex: 0 };
  }
  if (status === "analyzing") {
    return { value: 62, label: resolveFallbackLabel(status), activeStageIndex: 3 };
  }
  if (status === "generating") {
    return { value: 90, label: resolveFallbackLabel(status), activeStageIndex: 5 };
  }

  return { value: 0, label: resolveFallbackLabel(status), activeStageIndex: -1 };
}

function getViewState(status: FreeSnapshotStatus | null): FreeSnapshotViewState {
  if (status === "completed") {
    return "completed";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status) {
    return "running";
  }
  return "form";
}

function isTerminalStatus(status: FreeSnapshotStatus | null) {
  return status === "completed" || status === "failed";
}

export function useFreeSnapshotStatus(snapshotId: string | null) {
  const [statusPayload, setStatusPayload] =
    useState<FreeSnapshotStatusResponse | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollFailureCount, setPollFailureCount] = useState(0);

  useEffect(() => {
    if (!snapshotId) {
      setPollError(null);
      setPollFailureCount(0);
      return;
    }

    let cancelled = false;
    let timer: number | null = null;
    const poll = async () => {
      try {
        const data = await getFreeSnapshotStatus(snapshotId);
        if (cancelled) {
          return;
        }
        setStatusPayload(data);
        setPollError(null);
        setPollFailureCount(0);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : "Unable to refresh snapshot status.";
        setPollFailureCount((previous) => previous + 1);
        setPollError(message);
      }
    };

    void poll();
    if (isTerminalStatus(statusPayload?.status ?? null)) {
      return () => {
        cancelled = true;
      };
    }

    timer = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearInterval(timer);
      }
    };
  }, [snapshotId, statusPayload?.status]);

  const viewState =
    statusPayload?.status || snapshotId
      ? getViewState(statusPayload?.status ?? "queued")
      : "form";
  const progress = useMemo(
    () =>
      resolveFreeSnapshotProgress(
        statusPayload?.status ?? (snapshotId ? "queued" : null),
        statusPayload?.executionStage ?? null,
      ),
    [snapshotId, statusPayload?.executionStage, statusPayload?.status],
  );

  return {
    statusPayload,
    setStatusPayload,
    viewState,
    progress,
    pollError,
    pollFailureCount,
  };
}
