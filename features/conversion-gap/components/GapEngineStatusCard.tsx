"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Clock3, Radar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGapEngineLiveStatus } from "@/features/conversion-gap/components/GapEngineLiveStatusProvider";

type GapEngineStatusCardProps = {
  etaMinutes: number;
};

const TRACKED_STAGES = [
  "scraping_homepage",
  "scraping_pricing",
  "scraping_competitors",
  "gap_analysis",
  "competitor_synthesis",
  "scoring",
  "rewrite_generation",
  "finalizing",
] as const;

const STAGE_LABELS: Record<string, string> = {
  queued: "Queued",
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
type LiveStatus = "idle" | "running" | "complete" | "failed";

function stageCountFor(stage: string | null, status: LiveStatus): number {
  if (status === "idle") {
    return 0;
  }
  if (status === "complete") {
    return TRACKED_STAGES.length;
  }
  if (!stage) {
    return 0;
  }

  const index = TRACKED_STAGES.indexOf(
    stage as (typeof TRACKED_STAGES)[number],
  );
  return index >= 0 ? index + 1 : 0;
}

function stageLabel(stage: string | null): string {
  if (!stage) {
    return "Processing";
  }

  return STAGE_LABELS[stage] ?? "Processing";
}

export function GapEngineStatusCard({ etaMinutes }: GapEngineStatusCardProps) {
  const { liveStatus, reportStatus, executionStage, executionProgress } =
    useGapEngineLiveStatus();
  const currentStageLabel = stageLabel(executionStage);
  const progressValue = useMemo(() => {
    if (typeof executionProgress === "number") {
      const clamped = Math.max(0, Math.min(100, executionProgress));
      if (liveStatus === "running") {
        return Math.min(clamped, 99);
      }
      return clamped;
    }

    if (liveStatus === "complete" || liveStatus === "failed") {
      return 100;
    }

    return 0;
  }, [executionProgress, liveStatus]);

  const stagesComplete = stageCountFor(executionStage, liveStatus);

  const statusView =
    liveStatus === "running"
      ? {
          description: `Running: ${currentStageLabel}`,
          icon: Radar,
          tone: "text-primary",
        }
      : liveStatus === "complete"
        ? {
            description: "Report ready for executive review.",
            icon: CheckCircle2,
            tone: "text-chart-3",
          }
        : liveStatus === "failed"
          ? {
              description: "Latest analysis failed. Review inputs and retry.",
              icon: AlertCircle,
              tone: "text-destructive",
            }
          : {
              description: "Awaiting your next analysis request.",
              icon: Clock3,
              tone: "text-muted-foreground",
            };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground/85">Status</p>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {statusView.description}
          </h3>
        </div>
        <statusView.icon className={`h-5 w-5 ${statusView.tone}`} />
      </div>
      <div
        className={`mt-4 rounded-lg border border-border/60 p-4 ${
          liveStatus === "complete"
            ? "bg-chart-3/10"
            : liveStatus === "failed"
              ? "bg-destructive/10"
              : "bg-secondary/40"
        }`}
      >
        <p className="text-sm font-semibold text-foreground/85">Progress</p>
        <div
          className={`mt-3 flex items-center justify-between text-sm ${
            liveStatus === "complete"
              ? "text-chart-3"
              : liveStatus === "failed"
                ? "text-destructive"
                : "text-muted-foreground"
          }`}
        >
          <span>
            {stagesComplete} of {TRACKED_STAGES.length} stages
          </span>
          <span>
            {liveStatus === "running"
              ? typeof executionProgress === "number"
                ? `${progressValue}% - ${currentStageLabel}`
                : currentStageLabel
              : liveStatus === "complete"
                ? "100%"
                : liveStatus === "failed"
                  ? "Failed"
                  : "0%"}
          </span>
        </div>
        <Progress value={progressValue} variant="info" className="mt-2 h-2" />
        {liveStatus === "running" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {`Current stage: ${currentStageLabel}. Estimated completion: ${etaMinutes} minutes`}
          </p>
        ) : liveStatus === "complete" ? (
          <p className="mt-2 text-xs text-chart-3">
            Latest run completed. Start a new analysis to begin a fresh progress
            cycle.
          </p>
        ) : liveStatus === "failed" ? (
          <p className="mt-2 text-xs text-destructive">
            Latest run failed. Update inputs and run again.
          </p>
        ) : null}
      </div>
    </div>
  );
}
