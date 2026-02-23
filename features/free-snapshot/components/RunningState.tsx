import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { FreeSnapshotExecutionStage } from "@/features/free-snapshot/types/freeSnapshot.types";

const STAGE_SEQUENCE: Array<{
  key: FreeSnapshotExecutionStage;
  label: string;
}> = [
  { key: "fetching_homepage_content", label: "Fetch homepage" },
  { key: "extracting_positioning_signals", label: "Extract signals" },
  { key: "analyzing_competitor_structure", label: "Analyze competitors" },
  { key: "generating_executive_diagnosis", label: "Build diagnosis" },
  { key: "scoring_conversion_gaps", label: "Score gaps" },
  { key: "finalizing_snapshot", label: "Finalize snapshot" },
];

export function RunningState(props: {
  domain: string;
  competitorCount: number;
  startedAtIso: string;
  stageLabel: string;
  progressValue: number;
  activeStageIndex: number;
  pollError?: string | null;
  pollFailureCount?: number;
}) {
  const startedAt = new Date(props.startedAtIso);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Free Conversion Audit
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-foreground">
        Analyzing {props.domain}...
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This usually takes 15-30 seconds.
      </p>

      <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            {props.stageLabel}...
          </p>
        </div>
        <div className="mt-4">
          <Progress value={props.progressValue} />
          <p className="mt-2 text-xs text-muted-foreground">
            Progress: {props.progressValue}%
          </p>
        </div>
      </div>
      {props.pollError ? (
        <div className="mt-3 rounded-lg border border-border/60 bg-card/70 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Live status refresh interrupted ({props.pollFailureCount ?? 1} retry
            {props.pollFailureCount === 1 ? "" : "ies"}). Retrying
            automatically.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {STAGE_SEQUENCE.map((stage, index) => {
          const isComplete =
            props.activeStageIndex >= 0 && index < props.activeStageIndex;
          const isActive = index === props.activeStageIndex;
          return (
            <div
              key={stage.key}
              className={`rounded-lg border px-3 py-2 text-xs ${
                isActive
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : isComplete
                    ? "border-border/60 bg-card/80 text-foreground/85"
                    : "border-border/40 bg-card/50 text-muted-foreground"
              }`}
            >
              {stage.label}
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p>Domain: {props.domain}</p>
        <p>Competitors detected: {props.competitorCount}</p>
        <p>
          Secure analysis session started at{" "}
          {Number.isNaN(startedAt.getTime())
            ? "--:--"
            : startedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
        </p>
        <p>AI-powered structured analysis</p>
      </div>
    </div>
  );
}
