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
  status: "queued" | "running" | "completed" | "failed" | null;
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

const GapEngineLiveStatusContext =
  createContext<GapEngineLiveStatusContextValue | null>(null);

function normalizeLiveStatus(
  status: GapReportExecutionPayload["status"] | null,
  engineStatus: EngineStatus,
): LiveStatus {
  if (status === "queued" || status === "running") {
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

  useEffect(() => {
    setLive(getLatestSnapshot());
  }, [getLatestSnapshot]);

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
    const isRunning = live.status === "queued" || live.status === "running";
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
          return;
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
      } catch {
        // Keep previous state on polling failure.
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [live.reportId, live.status]);

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
