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
      <p className="text-sm font-semibold text-foreground/85">Revenue impact</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-foreground/80">
            Pipeline at risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(report.pipelineAtRisk)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/80">
            Projected recovery
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {currencyFormatter.format(
              report.revenueProjection.projectedPipelineRecovery,
            )}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/80">Clarity lift</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {report.revenueProjection.estimatedLiftPercent}%
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground/80">
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
