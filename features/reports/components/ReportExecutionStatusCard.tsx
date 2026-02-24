"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GapReportExecutionPayload } from "@/features/reports/types/reportExecution.types";
import { useReportExecutionPolling } from "@/features/reports/hooks/useReportExecutionPolling";

type ReportExecutionStatusCardProps = {
  reportId: string;
  initialExecution: GapReportExecutionPayload;
};

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

type EngineState = "queued" | "running" | "completed" | "failed";

type EngineStatus = {
  gapAnalysis: EngineState;
  objectionAnalysis: EngineState;
  differentiationAnalysis: EngineState;
  rewriteGeneration: EngineState;
};

function deriveEngineStatus(execution: GapReportExecutionPayload): EngineStatus {
  const status = execution.status;
  const stage = execution.executionStage;

  if (status === "completed") {
    return {
      gapAnalysis: "completed",
      objectionAnalysis: "completed",
      differentiationAnalysis: "completed",
      rewriteGeneration: "completed",
    };
  }

  if (status === "queued" || stage === "queued") {
    return {
      gapAnalysis: "queued",
      objectionAnalysis: "queued",
      differentiationAnalysis: "queued",
      rewriteGeneration: "queued",
    };
  }

  if (stage === "gap_analysis") {
    return {
      gapAnalysis: "running",
      objectionAnalysis: "queued",
      differentiationAnalysis: "queued",
      rewriteGeneration: "queued",
    };
  }

  if (stage === "competitor_synthesis") {
    return {
      gapAnalysis: "completed",
      objectionAnalysis: "running",
      differentiationAnalysis: "queued",
      rewriteGeneration: "queued",
    };
  }

  if (stage === "scoring") {
    return {
      gapAnalysis: "completed",
      objectionAnalysis: "completed",
      differentiationAnalysis: "running",
      rewriteGeneration: "queued",
    };
  }

  if (stage === "rewrite_generation") {
    return {
      gapAnalysis: "completed",
      objectionAnalysis: "completed",
      differentiationAnalysis: "completed",
      rewriteGeneration: "running",
    };
  }

  if (stage === "finalizing" || stage === "complete") {
    return {
      gapAnalysis: "completed",
      objectionAnalysis: "completed",
      differentiationAnalysis: "completed",
      rewriteGeneration: "completed",
    };
  }

  if (status === "running" || status === "retrying") {
    return {
      gapAnalysis: "running",
      objectionAnalysis: "queued",
      differentiationAnalysis: "queued",
      rewriteGeneration: "queued",
    };
  }

  return {
    gapAnalysis: "queued",
    objectionAnalysis: "queued",
    differentiationAnalysis: "queued",
    rewriteGeneration: "queued",
  };
}

type FailureGuidance = {
  title: string;
  explanation: string;
  recovery: string[];
  failedEngine:
    | "gapAnalysis"
    | "objectionAnalysis"
    | "differentiationAnalysis"
    | "rewriteGeneration";
};

function buildFailureGuidance(error: string | null): FailureGuidance {
  const raw = (error ?? "").trim();
  const normalized = raw.toLowerCase();

  if (
    normalized.includes("profile_missing") ||
    normalized.includes("onboarding")
  ) {
    return {
      title: "Onboarding context is incomplete",
      explanation:
        "Report generation stopped because required profile and ICP context was missing.",
      recovery: [
        "Complete the SaaS profile and differentiation matrix in onboarding.",
        "Retry the report after saving onboarding updates.",
      ],
      failedEngine: "gapAnalysis",
    };
  }

  if (
    normalized.includes("scrape") ||
    normalized.includes("fetch") ||
    normalized.includes("timeout")
  ) {
    return {
      title: "Source page extraction failed",
      explanation:
        "One or more homepage/pricing/competitor URLs could not be reliably extracted.",
      recovery: [
        "Verify all URLs are public, reachable, and return stable HTML.",
        "Retry with fewer competitor URLs, then add competitors incrementally.",
      ],
      failedEngine: "gapAnalysis",
    };
  }

  if (
    normalized.includes("objection") ||
    normalized.includes("missing_objection") ||
    normalized.includes("objection_analysis")
  ) {
    return {
      title: "Objection analysis did not validate",
      explanation:
        "The objection engine returned output that did not meet schema or specificity requirements.",
      recovery: [
        "Strengthen objection context in onboarding and proof points.",
        "Retry the report to generate a fresh objection synthesis pass.",
      ],
      failedEngine: "objectionAnalysis",
    };
  }

  if (
    normalized.includes("competitive") ||
    normalized.includes("differentiation") ||
    normalized.includes("positioning")
  ) {
    return {
      title: "Differentiation analysis failed quality checks",
      explanation:
        "Strategic positioning output was rejected for evidence quality or specificity.",
      recovery: [
        "Provide clearer competitor URLs and richer differentiation inputs.",
        "Retry after ensuring competitor pages include positioning and pricing signals.",
      ],
      failedEngine: "differentiationAnalysis",
    };
  }

  if (
    normalized.includes("rewrite") ||
    normalized.includes("incomplete_canonical_report_data:missing_rewrites")
  ) {
    return {
      title: "Rewrite generation did not complete",
      explanation:
        "The report could not finalize because rewrite outputs were incomplete.",
      recovery: [
        "Retry the report generation.",
        "If repeat failures occur, reduce input complexity and rerun.",
      ],
      failedEngine: "rewriteGeneration",
    };
  }

  if (
    normalized.includes("incomplete_canonical_report_data") ||
    normalized.includes("invalid_report_data")
  ) {
    return {
      title: "Report failed canonical validation",
      explanation:
        "The generated report did not meet strict canonical contract requirements.",
      recovery: [
        "Retry report generation with the same inputs.",
        "If the issue persists, regenerate after updating homepage/pricing inputs.",
      ],
      failedEngine: "differentiationAnalysis",
    };
  }

  return {
    title: "Report execution failed",
    explanation:
      raw.length > 0
        ? `Execution stopped due to: ${raw}`
        : "Execution stopped due to an unclassified processing error.",
    recovery: [
      "Retry the report with the same inputs.",
      "If the failure repeats, run with fewer competitors and verify all URLs.",
    ],
    failedEngine: "gapAnalysis",
  };
}

function applyFailedEngine(engineStatus: EngineStatus, failed: FailureGuidance["failedEngine"]): EngineStatus {
  return {
    ...engineStatus,
    [failed]: "failed",
  };
}

function formatEngineState(state: EngineState): string {
  if (state === "queued") {
    return "Queued";
  }
  if (state === "running") {
    return "Running";
  }
  if (state === "completed") {
    return "Completed";
  }
  return "Failed";
}

export function ReportExecutionStatusCard({
  reportId,
  initialExecution,
}: ReportExecutionStatusCardProps) {
  const router = useRouter();
  const [execution, setExecution] = useState(initialExecution);
  const [showStageSpinner, setShowStageSpinner] = useState(false);
  const [showCompletionTransition, setShowCompletionTransition] =
    useState(false);
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
  const failureGuidance = useMemo(
    () =>
      execution.status === "failed"
        ? buildFailureGuidance(execution.error)
        : null,
    [execution.error, execution.status],
  );
  const engineStatus = useMemo(() => {
    const base = deriveEngineStatus(execution);
    if (execution.status === "failed" && failureGuidance) {
      return applyFailedEngine(base, failureGuidance.failedEngine);
    }
    return base;
  }, [execution, failureGuidance]);
  const handlePollResult = useCallback(
    (nextExecution: GapReportExecutionPayload) => {
      setExecution(nextExecution);
      if (
        nextExecution.status === "completed" ||
        nextExecution.status === "failed"
      ) {
        if (
          nextExecution.status === "completed" &&
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
    },
    [router],
  );

  const { pollError } = useReportExecutionPolling({
    reportId,
    enabled: isInProgress,
    loggerSource: "report_execution_status_polling",
    onResult: handlePollResult,
  });

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
            ? failureGuidance?.explanation ??
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
        <div className="mt-4 rounded-lg border border-border/60 bg-secondary/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Per-engine execution
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground/90">Gap analysis</span>
              <span className="text-foreground">{formatEngineState(engineStatus.gapAnalysis)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/90">Objection analysis</span>
              <span className="text-foreground">
                {formatEngineState(engineStatus.objectionAnalysis)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/90">Differentiation analysis</span>
              <span className="text-foreground">
                {formatEngineState(engineStatus.differentiationAnalysis)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground/90">Rewrite generation</span>
              <span className="text-foreground">
                {formatEngineState(engineStatus.rewriteGeneration)}
              </span>
            </div>
          </div>
        </div>
        {execution.status === "failed" && failureGuidance ? (
          <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">
              {failureGuidance.title}
            </p>
            <p className="mt-1 text-sm text-foreground/90">
              {failureGuidance.explanation}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
              {failureGuidance.recovery.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
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
