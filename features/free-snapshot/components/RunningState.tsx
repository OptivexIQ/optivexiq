import { Loader2 } from "lucide-react";
import type {
  FreeSnapshotExecutionStage,
  FreeSnapshotStatus,
} from "@/features/free-snapshot/types/freeSnapshot.types";

const STAGE_LABELS: Record<FreeSnapshotExecutionStage, string> = {
  fetching_homepage_content: "Fetching homepage content...",
  extracting_positioning_signals: "Extracting positioning signals...",
  analyzing_competitor_structure: "Analyzing competitor structure...",
  generating_executive_diagnosis: "Generating executive diagnosis...",
  scoring_conversion_gaps: "Scoring conversion gaps...",
  finalizing_snapshot: "Finalizing snapshot...",
};

function fallbackStageLabel(status: FreeSnapshotStatus): string {
  if (status === "queued") {
    return "Queued for secure analysis...";
  }
  if (status === "scraping") {
    return "Fetching homepage content...";
  }
  if (status === "analyzing") {
    return "Generating executive diagnosis...";
  }
  if (status === "generating") {
    return "Finalizing snapshot...";
  }
  return "Preparing analysis...";
}

export function RunningState(props: {
  domain: string;
  competitorCount: number;
  startedAtIso: string;
  status: FreeSnapshotStatus;
  executionStage: FreeSnapshotExecutionStage | null;
}) {
  const startedAt = new Date(props.startedAtIso);
  const stageLabel = props.executionStage
    ? STAGE_LABELS[props.executionStage]
    : fallbackStageLabel(props.status);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-black/10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Free Conversion Audit
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-foreground">
        Analyzing {props.domain}...
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        This usually takes 15–30 seconds.
      </p>

      <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-5">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{stageLabel}</p>
        </div>
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
