"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

const chartConfig = {
  you: {
    label: "You",
    theme: {
      light: "var(--chart-1)",
      dark: "var(--chart-1)",
    },
  },
  competitors: {
    label: "Competitors",
    theme: {
      light: "var(--muted-foreground)",
      dark: "var(--muted-foreground)",
    },
  },
};

function riskTone(level: "low" | "medium" | "high") {
  if (level === "high") {
    return "text-destructive";
  }

  if (level === "medium") {
    return "text-chart-4";
  }

  return "text-chart-3";
}

type MessagingOverlapProps = {
  report: ConversionGapReport;
};

const riskFill = {
  low: "hsl(210 70% 55%)",
  medium: "hsl(43 74% 66%)",
  high: "hsl(0 84% 60%)",
} as const;

export function MessagingOverlap({ report }: MessagingOverlapProps) {
  const items = report.messagingOverlap.items;
  const ctaLabel = report.messagingOverlap.ctaLabel?.trim();

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Messaging overlap vs competitors
          </p>
          <p className="mt-2 text-sm text-foreground">
            Overlap risk is flagged where competitors mirror your positioning.
          </p>
        </div>
        {ctaLabel ? (
          <Button variant="secondary" asChild>
            <Link href={`/dashboard/reports/${report.id}/rewrite-recommendations`}>
              {ctaLabel}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-chart-1" />
          You
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
          Competitors
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[hsl(210_70%_55%)]" />
          Low overlap
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[hsl(43_74%_66%)]" />
          Moderate overlap
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[hsl(0_84%_60%)]" />
          High overlap
        </div>
      </div>

      <div className="mt-6 h-56">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto!"
        >
          <BarChart
            data={items}
            barCategoryGap={20}
            barGap={8}
            margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
          >
            <ReferenceArea
              y1={0}
              y2={25}
              fill="hsl(var(--muted))"
              fillOpacity={0.18}
            />
            <ReferenceArea
              y1={25}
              y2={50}
              fill="hsl(var(--secondary))"
              fillOpacity={0.18}
            />
            <ReferenceArea
              y1={50}
              y2={75}
              fill="hsl(var(--muted))"
              fillOpacity={0.18}
            />
            <ReferenceArea
              y1={75}
              y2={100}
              fill="hsl(var(--secondary))"
              fillOpacity={0.18}
            />
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="competitor"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
            />
            {/* <YAxis hide={true} /> */}
            <YAxis
              ticks={[0, 25, 50, 75, 100]}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
            />
            {[25, 50, 75].map((value) => (
              <ReferenceLine
                key={value}
                y={value}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            ))}
            <ChartTooltip
              content={<ChartTooltipContent labelKey="competitor" />}
            />
            <Bar dataKey="you" fill="var(--color-you)" radius={[6, 6, 0, 0]} />
            <Bar
              dataKey="competitors"
              fill="var(--color-competitors)"
              radius={[6, 6, 0, 0]}
              className="opacity-60"
            >
              {items.map((item) => (
                <Cell
                  key={item.competitor}
                  fill={riskFill[item.risk]}
                  className="opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {report.messagingOverlap.insight}
        </span>
      </p>
    </div>
  );
}
