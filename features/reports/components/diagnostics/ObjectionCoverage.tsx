import { Progress } from "@/components/ui/progress";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

function mapVariant(index: number) {
  const variants = [
    "critical-solid",
    "warning-solid",
    "performance",
    "critical-solid",
    "info-solid",
  ] as const;

  return variants[index % variants.length];
}

type ObjectionCoverageProps = {
  report: ConversionGapReport;
};

type CoverageValueProps = {
  value: number | string;
  variant?: ReturnType<typeof mapVariant>;
};

function coverageTone(variant: ReturnType<typeof mapVariant>) {
  switch (variant) {
    case "critical-solid":
      return "text-destructive";
    case "warning-solid":
      return "text-chart-4";
    case "performance":
      return "text-chart-3";
    case "info-solid":
      return "text-chart-2";
    default:
      return "text-muted-foreground";
  }
}

function CoverageValue({ value, variant }: CoverageValueProps) {
  return (
    <span className={variant ? coverageTone(variant) : "text-muted-foreground"}>
      {value}% Coverage
    </span>
  );
}

export function ObjectionCoverage({ report }: ObjectionCoverageProps) {
  const entries = Object.entries(report.objectionCoverage ?? {});
  const hasCoverage = entries.length > 0;
  const lateFunnelRisk = entries.some(
    ([label, value]) =>
      /risk reduction|trust/i.test(label) && Number(value) < 30,
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Objection coverage
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Late-funnel risk exposure: {lateFunnelRisk ? "Elevated" : "Contained"}
        </p>
      </div>
      <div className="mt-4 space-y-4">
        {hasCoverage ? (
          entries.map(([label, value], index) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{label}</span>
                <CoverageValue value={value} variant={mapVariant(index)} />
              </div>
              <Progress
                value={Number(value)}
                variant={mapVariant(index)}
                className="h-1.5"
              />
            </div>
          ))
        ) : (
          <p className="text-sm text-foreground">
            Objection coverage will populate once analysis completes.
          </p>
        )}
      </div>
    </div>
  );
}
