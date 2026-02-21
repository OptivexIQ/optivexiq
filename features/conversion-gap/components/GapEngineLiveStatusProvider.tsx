"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EngineStatus } from "@/data/engineDashboard";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";

type LiveStatus = "idle" | "running" | "complete" | "failed";

type LatestReportInput = {
  id: string | null;
  status: "queued" | "running" | "retrying" | "completed" | "failed" | null;
  executionStage?: string | null;
  executionProgress?: number | null;
};

type GapEngineLiveStatusContextValue = {
  liveStatus: LiveStatus;
  reportId: string | null;
  reportStatus: GapReportExecutionPayload["status"] | null;
  executionStage: string | null;
  executionProgress: number | null;
  startNewAnalysis: () => void;
  bindRunningReport: (reportId: string) => void;
  restoreLatestReport: () => void;
};

type GapEngineLiveStatusProviderProps = {
  engineStatus: EngineStatus;
  latestReport: LatestReportInput;
  children: ReactNode;
};

const POLL_INTERVAL_MS = 2500;
const POLL_FAILURE_THRESHOLD = 3;
const MAX_POLL_INTERVAL_MS = 20000;

const GapEngineLiveStatusContext =
  createContext<GapEngineLiveStatusContextValue | null>(null);

function normalizeLiveStatus(
  status: GapReportExecutionPayload["status"] | null,
  engineStatus: EngineStatus,
): LiveStatus {
  if (status === "queued" || status === "running" || status === "retrying") {
    return "running";
  }
  if (status === "completed") {
    return "complete";
  }
  if (status === "failed") {
    return "failed";
  }
  return engineStatus === "running" ? "running" : engineStatus;
}

export function GapEngineLiveStatusProvider({
  engineStatus,
  latestReport,
  children,
}: GapEngineLiveStatusProviderProps) {
  const getLatestSnapshot = useCallback(
    () => ({
      reportId: latestReport.id,
      status: latestReport.status,
      stage: latestReport.executionStage ?? null,
      progress: latestReport.executionProgress ?? null,
    }),
    [
      latestReport.id,
      latestReport.status,
      latestReport.executionStage,
      latestReport.executionProgress,
    ],
  );

  const [live, setLive] = useState({
    reportId: latestReport.id,
    status: latestReport.status,
    stage: latestReport.executionStage ?? null,
    progress: latestReport.executionProgress ?? null,
  });
  const [pollFailureCount, setPollFailureCount] = useState(0);

  useEffect(() => {
    setLive(getLatestSnapshot());
    setPollFailureCount(0);
  }, [getLatestSnapshot]);
  const pollIntervalMs = useMemo(() => {
    const exponent = Math.min(pollFailureCount, POLL_FAILURE_THRESHOLD);
    return Math.min(POLL_INTERVAL_MS * 2 ** exponent, MAX_POLL_INTERVAL_MS);
  }, [pollFailureCount]);

  const startNewAnalysis = useCallback(() => {
    setLive(() => ({
      reportId: null,
      status: "queued",
      stage: "queued",
      progress: 0,
    }));
  }, []);

  const bindRunningReport = useCallback((reportId: string) => {
    setLive({
      reportId,
      status: "queued",
      stage: "queued",
      progress: 0,
    });
  }, []);

  const restoreLatestReport = useCallback(() => {
    setLive(getLatestSnapshot());
  }, [getLatestSnapshot]);

  useEffect(() => {
    const isRunning =
      live.status === "queued" ||
      live.status === "running" ||
      live.status === "retrying";
    if (!live.reportId || !isRunning) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/reports/${live.reportId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`poll_http_error:${response.status}`);
        }

        const body = (await response.json()) as {
          report: GapReportExecutionPayload;
        };

        if (cancelled) {
          return;
        }

        setLive({
          reportId: body.report.id,
          status: body.report.status,
          stage: body.report.executionStage,
          progress: body.report.executionProgress,
        });
        setPollFailureCount(0);
      } catch (error) {
        const errorType =
          error instanceof Error && error.message
            ? error.message
            : "poll_failure";
        const context = {
          source: "gap_engine_live_status_polling",
          route: `/api/reports/${live.reportId}`,
          report_id: live.reportId,
          previous_status: live.status,
          error_type: errorType,
          timestamp: new Date().toISOString(),
        };
        console.error("Gap engine polling failed.", context);
        setPollFailureCount((previous) => {
          const next = previous + 1;
          return next >= POLL_FAILURE_THRESHOLD ? POLL_FAILURE_THRESHOLD : next;
        });
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [live.reportId, live.status, pollIntervalMs]);

  const value = useMemo<GapEngineLiveStatusContextValue>(
    () => ({
      liveStatus: normalizeLiveStatus(live.status, engineStatus),
      reportId: live.reportId,
      reportStatus: live.status,
      executionStage: live.stage,
      executionProgress: live.progress,
      startNewAnalysis,
      bindRunningReport,
      restoreLatestReport,
    }),
    [
      bindRunningReport,
      engineStatus,
      live.reportId,
      live.progress,
      live.stage,
      live.status,
      restoreLatestReport,
      startNewAnalysis,
    ],
  );

  return (
    <GapEngineLiveStatusContext.Provider value={value}>
      {children}
    </GapEngineLiveStatusContext.Provider>
  );
}

export function useGapEngineLiveStatus() {
  const context = useContext(GapEngineLiveStatusContext);
  if (!context) {
    throw new Error(
      "useGapEngineLiveStatus must be used within GapEngineLiveStatusProvider.",
    );
  }
  return context;
}
