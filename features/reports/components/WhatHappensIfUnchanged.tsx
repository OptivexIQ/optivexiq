import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { TrendingUp } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatThreat(level: ConversionGapReport["threatLevel"]) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function averageCoverage(values: number[]) {
  if (!values.length) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function buildForecast(report: ConversionGapReport) {
  const highRiskOverlapCount = report.messagingOverlap.items.filter(
    (item) => item.risk === "high",
  ).length;
  const coverageValues = Object.values(report.objectionCoverage ?? {}).map(
    (value) => Number(value),
  );
  const objectionCoverageAverage = averageCoverage(
    coverageValues.filter((value) => Number.isFinite(value)),
  );
  const matrixSignalCount = Object.keys(report.competitiveMatrix ?? {}).length;
  const recovery = Math.max(
    0,
    report.revenueProjection.projectedPipelineRecovery || 0,
  );

  const signals = [
    `Threat level is ${formatThreat(report.threatLevel)} with ${report.funnelRisk}% funnel risk and ${report.differentiationScore} differentiation score.`,
    `Modeled at-risk pipeline is ${currencyFormatter.format(report.pipelineAtRisk)} with ${currencyFormatter.format(recovery)} recoverable if conversion gaps are addressed.`,
    highRiskOverlapCount > 0
      ? `${highRiskOverlapCount} high-overlap competitor signal${highRiskOverlapCount === 1 ? "" : "s"} currently increase substitution pressure.`
      : "No high-overlap competitor signals are currently flagged.",
    objectionCoverageAverage !== null
      ? `Average objection coverage is ${objectionCoverageAverage}%, indicating remaining late-funnel trust and risk-handling exposure.`
      : "Objection coverage data is not yet populated, which limits confidence in late-funnel risk handling.",
    matrixSignalCount > 0
      ? `Competitive matrix includes ${matrixSignalCount} tracked signal${matrixSignalCount === 1 ? "" : "s"} to monitor drift over time.`
      : "Competitive matrix signals are still pending and should be monitored as new comparisons are analyzed.",
  ];

  return signals.join(" ");
}

type WhatHappensIfUnchangedProps = {
  report: ConversionGapReport;
};

export function WhatHappensIfUnchanged({
  report,
}: WhatHappensIfUnchangedProps) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-linear-to-br from-destructive/10 via-card to-card p-6 shadow-[0_0_40px_hsl(var(--destructive)/0.12)]">
      <div className="flex items-center gap-2 text-destructive">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
          <TrendingUp className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold">
          Predictive Modeling: Inertia Risk
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {buildForecast(report)}
      </p>
    </div>
  );
}
