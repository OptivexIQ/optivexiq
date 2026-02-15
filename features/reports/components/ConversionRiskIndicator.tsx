import type { ConversionGapReport } from "@/features/reports/types/report.types";

function deriveRiskLevel(report: ConversionGapReport) {
  const highRisk = report.funnelRisk >= 70 || report.differentiationScore <= 25;
  const moderateRisk = report.funnelRisk >= 50 || report.clarityScore <= 45;

  if (highRisk) {
    return {
      level: "High",
      tone: "text-destructive",
      summary:
        "Revenue risk is elevated due to late-funnel exposure and weak differentiation.",
    };
  }

  if (moderateRisk) {
    return {
      level: "Moderate",
      tone: "text-chart-4",
      summary: "Risk is contained but decision confidence is still fragile.",
    };
  }

  return {
    level: "Low",
    tone: "text-chart-3",
    summary: "Risk remains manageable with only minor conversion leakage.",
  };
}

type ConversionRiskIndicatorProps = {
  report: ConversionGapReport;
};

export function ConversionRiskIndicator({
  report,
}: ConversionRiskIndicatorProps) {
  const risk = deriveRiskLevel(report);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Revenue risk level
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl font-semibold ${risk.tone}`}>
          {risk.level}
        </span>
        <span className="text-xs text-muted-foreground">
          {report.funnelRisk}% funnel risk
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground">{risk.summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Exposure is driven by late-funnel objections and pricing clarity.
      </p>
    </div>
  );
}
