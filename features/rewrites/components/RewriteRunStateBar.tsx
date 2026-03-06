"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  ShieldAlert,
  WifiOff,
} from "lucide-react";

type RewriteRunStateBarProps = {
  status: "ready" | "processing" | "offline" | "error";
  stageLabel?: string | null;
  confidence?: string | null;
  deltaScore?: string | null;
  experimentId?: string | null;
  versionNumber?: number | null;
  requestRef?: string | null;
  isWinner?: boolean;
  winnerLabel?: string | null;
  idempotentReplay?: boolean;
};

function statusCopy(status: RewriteRunStateBarProps["status"]) {
  if (status === "processing") {
    return {
      label: "Processing",
      detail: "Generating rewrite output and validating experiment contract.",
      icon: Activity,
      tone: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    };
  }
  if (status === "offline") {
    return {
      label: "Offline",
      detail: "Reconnect to run rewrite requests or sync version history.",
      icon: WifiOff,
      tone: "text-slate-300 border-slate-500/30 bg-slate-500/10",
    };
  }
  if (status === "error") {
    return {
      label: "Attention Required",
      detail: "Last rewrite run failed and may need contract or prompt adjustments.",
      icon: AlertTriangle,
      tone: "text-rose-300 border-rose-500/30 bg-rose-500/10",
    };
  }
  return {
    label: "Ready",
    detail: "Studio is ready for a new controlled variation.",
    icon: CheckCircle2,
    tone: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
  };
}

function detailValue(value: string | number | null | undefined, fallback = "Pending") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  return String(value);
}

export function RewriteRunStateBar({
  status,
  stageLabel,
  confidence,
  deltaScore,
  experimentId,
  versionNumber,
  requestRef,
  isWinner,
  winnerLabel,
  idempotentReplay,
}: RewriteRunStateBarProps) {
  const meta = statusCopy(status);
  const StatusIcon = meta.icon;

  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.08em] ${meta.tone}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {meta.label}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{meta.detail}</p>
          {stageLabel ? (
            <p className="text-xs text-muted-foreground">
              Current stage: <span className="text-foreground/90">{stageLabel}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
              Confidence
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {detailValue(confidence, "Not scored")}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
              Delta Score
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {detailValue(deltaScore, "Pending")}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Experiment
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {detailValue(experimentId)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            Version
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {detailValue(versionNumber)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Request Ref
          </div>
          <p className="mt-1.5 truncate text-sm font-medium text-foreground">
            {detailValue(requestRef)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Decision State
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">
            {isWinner
              ? `Winner${winnerLabel ? ` (${winnerLabel})` : ""}`
              : idempotentReplay
                ? "Replay returned"
                : "Candidate variation"}
          </p>
        </div>
      </div>
    </section>
  );
}
