"use client";

import { CheckCircle2, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

type RewriteShiftStatsCardsProps = {
  running: boolean;
  shiftStatsOverride?: {
    clarityShift: string;
    objectionShift: string;
    positioningShift: "Strong" | "Moderate" | "Weak" | "Improving" | "Needs Work";
  } | null;
};

function normalizeShiftValue(value: string) {
  const normalized = value.trim();
  if (/^(?:strong|moderate|weak)$/i.test(normalized)) {
    return {
      value:
        normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase(),
      trend: "neutral" as const,
    };
  }

  const match = normalized.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!match) {
    return { value: normalized, trend: "neutral" as const };
  }

  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) {
    return { value: normalized, trend: "neutral" as const };
  }

  return {
    value: `${numeric > 0 ? "+" : ""}${numeric}%`,
    trend:
      numeric > 0
        ? ("up" as const)
        : numeric < 0
          ? ("down" as const)
          : ("neutral" as const),
  };
}

export function RewriteShiftStatsCards({
  running,
  shiftStatsOverride,
}: RewriteShiftStatsCardsProps) {
  const shiftStats = shiftStatsOverride;
  if (!shiftStats) {
    const helperText = running
      ? "Generating shift metrics from this rewrite..."
      : "Shift metrics appear after a successful rewrite with validated stats.";
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Clarity Shift
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none text-muted-foreground">
            -
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Objection Shift
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none text-muted-foreground">
            -
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-muted-foreground">
            Positioning Shift
          </p>
          <p className="mt-2 text-2xl font-semibold leading-none text-muted-foreground">
            -
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
        </div>
      </div>
    );
  }

  const clarity = normalizeShiftValue(shiftStats.clarityShift);
  const objection = normalizeShiftValue(shiftStats.objectionShift);
  const positioning = normalizeShiftValue(shiftStats.positioningShift);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Clarity Shift
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-semibold leading-none text-foreground">
            {clarity.value}
          </p>
          {clarity.trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : clarity.trend === "down" ? (
            <TrendingDown className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Objection Shift
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-semibold leading-none text-foreground">
            {objection.value}
          </p>
          {objection.trend === "up" ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : objection.trend === "down" ? (
            <TrendingDown className="h-4 w-4 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 sm:col-span-2 xl:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Positioning Shift
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-3xl font-semibold leading-none text-foreground">
            {positioning.value}
          </p>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
