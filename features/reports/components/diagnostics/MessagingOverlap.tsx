"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

const chartConfig = {
  you: {
    label: "You (baseline)",
    color: "hsl(224 58% 62%)",
  },
  competitor: {
    label: "Competitor",
    color: "hsl(220 12% 58%)",
  },
  low: {
    label: "Low overlap",
    color: "hsl(198 60% 50%)",
  },
  moderate: {
    label: "Moderate overlap",
    color: "hsl(41 58% 54%)",
  },
  high: {
    label: "High overlap",
    color: "hsl(8 68% 55%)",
  },
};

const riskFill = {
  low: "hsl(198 60% 50%)",
  medium: "hsl(41 58% 54%)",
  high: "hsl(8 68% 55%)",
} as const;

type MessagingOverlapProps = {
  report: ConversionGapReport;
};

type Mode = "comparison" | "distribution";

type ComparisonRow = {
  competitor: string;
  you: number;
  competitorScore: number;
  risk: "low" | "medium" | "high";
  delta: number;
};

type DistributionRow = {
  competitor: string;
  low: number;
  moderate: number;
  high: number;
  overlapScore: number;
  risk: "low" | "medium" | "high";
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function riskLabel(risk: "low" | "medium" | "high") {
  if (risk === "high") {
    return "High substitution risk";
  }
  if (risk === "medium") {
    return "Moderate substitution risk";
  }
  return "Low substitution risk";
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function inferDistribution(
  overlapScore: number,
  risk: "low" | "medium" | "high",
) {
  const overlap = clampPercent(overlapScore);
  const highWeight = risk === "high" ? 0.72 : risk === "medium" ? 0.46 : 0.24;
  const high = Math.round(overlap * highWeight);
  const moderate = Math.max(0, overlap - high);
  const low = Math.max(0, 100 - overlap);
  return { low, moderate, high };
}

function normalizeDistribution(
  distribution:
    | {
        low: number;
        moderate: number;
        high: number;
      }
    | undefined,
) {
  if (!distribution) {
    return null;
  }
  const low = clampPercent(distribution.low);
  const moderate = clampPercent(distribution.moderate);
  const high = Math.max(0, 100 - low - moderate);
  return { low, moderate, high: clampPercent(high) };
}

function ComparisonTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: ComparisonRow }>;
}) {
  const row = props.payload?.[0]?.payload;
  if (!props.active || !row) {
    return null;
  }

  const absoluteDelta = Math.abs(row.delta);
  const deltaLabel =
    row.delta > 0
      ? `+${absoluteDelta}% vs you`
      : row.delta < 0
        ? `-${absoluteDelta}% vs you`
        : "Matches your baseline";

  return (
    <div className="min-w-56 rounded-lg border border-border/70 bg-background/95 p-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-foreground">{row.competitor}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {riskLabel(row.risk)}
      </p>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">You baseline</span>
          <span className="font-medium text-foreground">
            {percent(row.you)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Competitor overlap</span>
          <span className="font-medium text-foreground">
            {percent(row.competitorScore)}
          </span>
        </div>
      </div>
      <div className="mt-3 border-t border-border/60 pt-2">
        <p className="text-xs text-muted-foreground">{deltaLabel}</p>
      </div>
    </div>
  );
}

function DistributionTooltip(props: {
  active?: boolean;
  payload?: Array<{ payload: DistributionRow }>;
}) {
  const row = props.payload?.[0]?.payload;
  if (!props.active || !row) {
    return null;
  }

  return (
    <div className="min-w-56 rounded-lg border border-border/70 bg-background/95 p-3 text-sm shadow-xl backdrop-blur-sm">
      <p className="font-semibold text-foreground">{row.competitor}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {riskLabel(row.risk)}
      </p>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Low overlap</span>
          <span className="font-medium text-foreground">
            {percent(row.low)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Moderate overlap</span>
          <span className="font-medium text-foreground">
            {percent(row.moderate)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">High overlap</span>
          <span className="font-medium text-foreground">
            {percent(row.high)}
          </span>
        </div>
      </div>
      <div className="mt-3 border-t border-border/60 pt-2">
        <p className="text-xs text-muted-foreground">
          Total overlap score: {percent(row.overlapScore)}
        </p>
      </div>
    </div>
  );
}

export function MessagingOverlap({ report }: MessagingOverlapProps) {
  const [mode, setMode] = useState<Mode>("comparison");
  const items = report.messagingOverlap.items;
  const ctaLabel = report.messagingOverlap.ctaLabel?.trim();
  const hasDistributionData =
    items.length > 0 &&
    items.every(
      (item) =>
        (item.overlapDistribution?.dimensions ?? 0) > 0 &&
        typeof item.overlapDistribution?.low === "number" &&
        typeof item.overlapDistribution?.moderate === "number" &&
        typeof item.overlapDistribution?.high === "number",
    );
  const hasMultipleModes = hasDistributionData;

  useEffect(() => {
    if (!hasDistributionData && mode === "distribution") {
      setMode("comparison");
    }
  }, [hasDistributionData, mode]);

  const comparisonData = useMemo<ComparisonRow[]>(
    () =>
      items
        .map((item) => {
          const you = clampPercent(item.you);
          const competitorScore = clampPercent(item.competitors);
          const delta = competitorScore - you;
          return {
            competitor: item.competitor,
            you,
            competitorScore,
            risk: item.risk,
            delta,
          };
        })
        .sort((a, b) => b.competitorScore - a.competitorScore),
    [items],
  );

  const distributionData = useMemo<DistributionRow[]>(
    () =>
      items
        .map((item) => {
          const overlapScore = clampPercent(item.competitors);
          const explicitDistribution = normalizeDistribution(
            item.overlapDistribution,
          );
          const distribution =
            explicitDistribution ?? inferDistribution(overlapScore, item.risk);
          return {
            competitor: item.competitor,
            overlapScore,
            risk: item.risk,
            ...distribution,
          };
        })
        .sort((a, b) => b.high - a.high),
    [items],
  );

  const highestComparison = comparisonData[0];
  const highestDistribution = distributionData[0];
  const minChartWidth = Math.max(760, comparisonData.length * 120);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground/90">
            Messaging overlap vs competitors
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "comparison"
              ? "Baseline comparison mode: your messaging vs each competitor."
              : "Distribution mode: low/moderate/high overlap across messaging dimensions."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasMultipleModes ? (
            <div className="inline-flex rounded-lg border border-border/60 bg-secondary/40 p-1">
              <button
                type="button"
                onClick={() => setMode("comparison")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === "comparison"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Baseline comparison
              </button>
              <button
                type="button"
                onClick={() => setMode("distribution")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  mode === "distribution"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overlap distribution
              </button>
            </div>
          ) : null}
          {ctaLabel ? (
            <Button variant="secondary" size="sm" asChild>
              <Link
                href={`/dashboard/reports/${report.id}/rewrite-recommendations`}
              >
                {ctaLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {mode === "comparison" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[hsl(224_58%_62%)]" />
            You baseline
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(199_66%_52%)]" />
            Low risk competitor
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(41_58%_54%)]" />
            Moderate risk competitor
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(8_68%_55%)]" />
            High risk competitor
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(199_66%_52%)]" />
            Low overlap
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(41_58%_54%)]" />
            Moderate overlap
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.75 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-[hsl(8_68%_55%)]" />
            High overlap
          </span>
        </div>
      )}

      <div className="mt-6 h-80 overflow-x-auto">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto!"
          style={{ minWidth: `${minChartWidth}px` }}
        >
          {mode === "comparison" ? (
            <BarChart
              data={comparisonData}
              barCategoryGap={8}
              barGap={2}
              margin={{ top: 18, right: 12, left: 8, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="competitor"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                height={44}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {payload.value}
                  </text>
                )}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                axisLine={false}
                width={38}
              />

              <ChartTooltip
                cursor={{ fill: "hsl(var(--secondary) / 0.25)" }}
                content={<ComparisonTooltip />}
              />

              <Bar
                dataKey="you"
                fill="var(--color-you)"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                dataKey="competitorScore"
                fill="var(--color-competitor)"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              >
                {comparisonData.map((row) => (
                  <Cell
                    key={`competitor-${row.competitor}`}
                    fill={riskFill[row.risk]}
                    stroke={riskFill[row.risk]}
                  />
                ))}
                <LabelList
                  dataKey="competitorScore"
                  position="top"
                  formatter={(value: number) => `${value}%`}
                  className="fill-foreground text-xs font-semibold"
                />
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={distributionData}
              barCategoryGap={24}
              barGap={0}
              margin={{ top: 14, right: 14, left: 8, bottom: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="competitor"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                height={44}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {payload.value}
                  </text>
                )}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tickLine={false}
                axisLine={false}
                width={38}
              />

              <ChartTooltip
                cursor={{ fill: "hsl(var(--secondary) / 0.25)" }}
                content={<DistributionTooltip />}
              />

              <Bar
                dataKey="low"
                stackId="overlap"
                fill="var(--color-low)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="moderate"
                stackId="overlap"
                fill="var(--color-moderate)"
              />
              <Bar
                dataKey="high"
                stackId="overlap"
                fill="var(--color-high)"
                radius={[4, 4, 0, 0]}
              >
                <LabelList
                  dataKey="overlapScore"
                  position="top"
                  formatter={(value: number) => `${value}%`}
                  className="fill-foreground text-xs font-semibold"
                />
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      </div>

      <div className="mt-5 rounded-lg border border-border/60 bg-secondary/30 p-3">
        <p className="text-sm text-foreground">
          {mode === "comparison"
            ? "Competitor bars show overlap against your baseline. Higher values indicate stronger messaging parity and greater substitution risk."
            : "Higher high-overlap segments indicate competitors with near-identical messaging, increasing substitution risk."}
          {mode === "comparison" && highestComparison
            ? ` ${highestComparison.competitor} currently shows the highest overlap.`
            : ""}
          {mode === "distribution" && highestDistribution
            ? ` ${highestDistribution.competitor} currently has the largest high-overlap share.`
            : ""}
          {mode === "distribution" && !hasDistributionData
            ? " Distribution mode requires per-dimension overlap matrix data."
            : ""}
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {report.messagingOverlap.insight}
        </span>
      </p>
    </div>
  );
}
