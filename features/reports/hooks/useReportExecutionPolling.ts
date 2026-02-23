"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";
import { getReportExecution } from "@/features/reports/clients/reportExecutionClient";

type UseReportExecutionPollingOptions = {
  reportId: string | null;
  enabled: boolean;
  loggerSource: string;
  onResult: (execution: GapReportExecutionPayload) => void;
  pollIntervalMs?: number;
  maxPollIntervalMs?: number;
  pollFailureThreshold?: number;
};

export function useReportExecutionPolling({
  reportId,
  enabled,
  loggerSource,
  onResult,
  pollIntervalMs = 2500,
  maxPollIntervalMs = 20000,
  pollFailureThreshold = 3,
}: UseReportExecutionPollingOptions) {
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const pollingRef = useRef(false);

  const computedIntervalMs = useMemo(() => {
    const exponent = Math.min(pollFailureCount, pollFailureThreshold);
    return Math.min(pollIntervalMs * 2 ** exponent, maxPollIntervalMs);
  }, [maxPollIntervalMs, pollFailureCount, pollFailureThreshold, pollIntervalMs]);

  useEffect(() => {
    if (!enabled || !reportId) {
      return;
    }

    let mounted = true;
    const poll = async () => {
      if (pollingRef.current) {
        return;
      }
      pollingRef.current = true;
      try {
        const body = await getReportExecution(reportId);
        if (!mounted) {
          return;
        }
        onResult(body.report);
        setPollError(null);
        setPollFailureCount(0);
      } catch (error) {
        const errorType =
          error instanceof Error && error.message
            ? error.message
            : "report_execution_poll_failed";
        console.error("Report execution polling failed.", {
          source: loggerSource,
          route: `/api/reports/${reportId}`,
          report_id: reportId,
          error_type: errorType,
          timestamp: new Date().toISOString(),
        });
        if (mounted) {
          setPollFailureCount((previous) => {
            const next = previous + 1;
            if (next >= pollFailureThreshold) {
              setPollError(
                "Unable to refresh progress right now. Still retrying.",
              );
              return next;
            }
            setPollError("Unable to refresh progress. Retrying.");
            return next;
          });
        }
      } finally {
        pollingRef.current = false;
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, computedIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [
    computedIntervalMs,
    enabled,
    loggerSource,
    onResult,
    pollFailureThreshold,
    reportId,
  ]);

  return {
    pollError,
    pollFailureCount,
  };
}
