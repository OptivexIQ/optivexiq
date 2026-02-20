import { Progress } from "@/components/ui/progress";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

type GapScoreCardProps = {
  report: ConversionGapReport;
};

function scoreTone(score: number) {
  if (score >= 70) {
    return "text-chart-3";
  }

  if (score >= 45) {
    return "text-chart-4";
  }

  return "text-destructive";
}

export function GapScoreCard({ report }: GapScoreCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-sm font-semibold text-foreground/85">Gap score</p>
      <div className="mt-3 flex items-end gap-2">
        <span
          className={`text-3xl font-semibold ${scoreTone(report.conversionScore)}`}
        >
          {report.conversionScore}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <Progress
        value={report.conversionScore}
        variant="critical"
        className="mt-3 h-2"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Overall conversion efficiency across clarity, pricing, and
        differentiation.
      </p>
    </div>
  );
}
