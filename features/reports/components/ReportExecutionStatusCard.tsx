"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";

type ReportExecutionStatusCardProps = {
  reportId: string;
  initialExecution: GapReportExecutionPayload;
};

const POLL_INTERVAL_MS = 2500;
const POLL_FAILURE_THRESHOLD = 3;
const MAX_POLL_INTERVAL_MS = 20000;

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
  retrying: "Retrying",
  scraping_homepage: "Scraping homepage",
  scraping_pricing: "Scraping pricing",
  scraping_competitors: "Scraping competitors",
  gap_analysis: "Running gap analysis",
  competitor_synthesis: "Synthesizing competitor intelligence",
  scoring: "Computing score",
  rewrite_generation: "Generating rewrites",
  finalizing: "Finalizing report",
  complete: "Complete",
  failed: "Failed",
};

function getStageLabel(stage: string | null) {
  if (!stage) {
    return "Processing";
  }

  return STAGE_LABELS[stage] ?? "Processing";
}

export function ReportExecutionStatusCard({
  reportId,
  initialExecution,
}: ReportExecutionStatusCardProps) {
  const router = useRouter();
  const [execution, setExecution] = useState(initialExecution);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const [showStageSpinner, setShowStageSpinner] = useState(false);
  const [showCompletionTransition, setShowCompletionTransition] =
    useState(false);
  const pollingRef = useRef(false);
  const completionHandledRef = useRef(false);

  const isInProgress =
    execution.status === "queued" ||
    execution.status === "running" ||
    execution.status === "retrying";
  const isCompleted = execution.status === "completed";

  const progressValue = useMemo(() => {
    if (typeof execution.executionProgress === "number") {
      return Math.max(0, Math.min(100, execution.executionProgress));
    }
    return execution.status === "failed" || execution.status === "completed"
      ? 100
      : 0;
  }, [execution.executionProgress, execution.status]);
  const pollIntervalMs = useMemo(() => {
    const exponent = Math.min(pollFailureCount, POLL_FAILURE_THRESHOLD);
    return Math.min(POLL_INTERVAL_MS * 2 ** exponent, MAX_POLL_INTERVAL_MS);
  }, [pollFailureCount]);

  useEffect(() => {
    setShowStageSpinner(false);
    if (!isInProgress) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowStageSpinner(true);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isInProgress, execution.executionStage]);

  useEffect(() => {
    if (!isInProgress) {
      return;
    }

    let mounted = true;
    const poll = async () => {
      if (pollingRef.current) {
        return;
      }
      pollingRef.current = true;
      try {
        const response = await fetch(`/api/reports/${reportId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`report_poll_failed_${response.status}`);
        }
        const body = (await response.json()) as {
          report: GapReportExecutionPayload;
        };
        if (!mounted) {
          return;
        }
        setExecution(body.report);
        setPollError(null);
        setPollFailureCount(0);
        if (
          body.report.status === "completed" ||
          body.report.status === "failed"
        ) {
          if (
            body.report.status === "completed" &&
            !completionHandledRef.current
          ) {
            completionHandledRef.current = true;
            setShowCompletionTransition(true);
            window.setTimeout(() => {
              router.refresh();
            }, 700);
            return;
          }
          router.refresh();
        }
      } catch (error) {
        const errorType =
          error instanceof Error && error.message
            ? error.message
            : "report_execution_poll_failed";
        console.error("Report execution polling failed.", {
          source: "report_execution_status_polling",
          route: `/api/reports/${reportId}`,
          report_id: reportId,
          error_type: errorType,
          timestamp: new Date().toISOString(),
        });
        if (mounted) {
          setPollFailureCount((prev) => {
            const next = prev + 1;
            if (next >= POLL_FAILURE_THRESHOLD) {
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
    }, pollIntervalMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [isInProgress, pollIntervalMs, reportId, router]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="flex items-center gap-2">
          {execution.status === "failed" ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : showCompletionTransition ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : showStageSpinner ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : null}
          <p className="text-sm font-semibold text-foreground/85">
            {execution.status === "failed"
              ? "Analysis failed"
              : isCompleted
                ? "Analysis complete"
                : showCompletionTransition
                  ? "Analysis complete"
                  : "Analysis in progress"}
          </p>
        </div>
        <p className="mt-2 text-sm text-foreground">
          {execution.status === "failed"
            ? execution.error ??
              "Report processing failed. Review inputs and run a new analysis."
            : isCompleted
              ? "Report completed successfully. Loading final output."
              : showCompletionTransition
                ? "Report completed successfully. Loading final output."
                : "We are processing your conversion gap report. This page updates automatically."}
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{getStageLabel(execution.executionStage)}</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} />
        </div>
        <p className="mt-2 text-sm text-foreground/85">
          Status: {execution.status}
        </p>
        {pollError ? (
          <p className="mt-2 text-sm text-destructive">{pollError}</p>
        ) : null}
        {execution.status === "failed" ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/gap-engine">Run new analysis</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard/reports">Back to reports</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link href="/dashboard/reports">Back to reports</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
