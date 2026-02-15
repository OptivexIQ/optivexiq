import type { ConversionGapReport } from "@/features/reports/types/report.types";

function threatTone(level: ConversionGapReport["threatLevel"]) {
  if (level === "high") {
    return "text-destructive";
  }

  if (level === "medium") {
    return "text-chart-4";
  }

  return "text-chart-3";
}

type CompetitiveThreatLevelProps = {
  report: ConversionGapReport;
};

export function CompetitiveThreatLevel({
  report,
}: CompetitiveThreatLevelProps) {
  const label =
    report.threatLevel.charAt(0).toUpperCase() + report.threatLevel.slice(1);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Competitive threat level
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl font-semibold ${threatTone(report.threatLevel)}`}
        >
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          Differentiation score {report.differentiationScore}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground">
        Messaging overlap and differentiation gaps are increasing substitution
        risk during competitive reviews.
      </p>
    </div>
  );
}
