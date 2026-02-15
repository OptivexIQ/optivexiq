import type { ConversionGapReport } from "@/features/reports/types/report.types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

type RevenueImpactPanelProps = {
  report: ConversionGapReport;
};

export function RevenueImpactPanel({ report }: RevenueImpactPanelProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Revenue impact
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Pipeline at risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(report.pipelineAtRisk)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Projected recovery
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(
              report.revenueProjection.projectedPipelineRecovery,
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Clarity lift
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {report.revenueProjection.estimatedLiftPercent}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Modeled win-rate delta
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {report.revenueProjection.modeledWinRateDelta}%
          </p>
        </div>
      </div>
    </div>
  );
}
