import type { ConversionGapReport } from "@/features/reports/types/report.types";

type CompetitiveInsightsPanelProps = {
  report: ConversionGapReport;
};

function confidenceTone(value: number): string {
  if (value >= 0.75) {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
  if (value >= 0.5) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-rose-500/40 bg-rose-500/10 text-rose-300";
}

function priorityTone(value: "P0" | "P1" | "P2" | undefined): string {
  if (value === "P0") {
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }
  if (value === "P1") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-sky-500/40 bg-sky-500/10 text-sky-200";
}

function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}% confidence`;
}

export function CompetitiveInsightsPanel({
  report,
}: CompetitiveInsightsPanelProps) {
  const insights = report.competitiveInsights.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div>
        <p className="text-sm font-semibold text-foreground/85">
          Competitive insights
        </p>
        <p className="mt-2 text-sm text-foreground">
          Evidence-backed claims with reasoning confidence for positioning
          decisions.
        </p>
      </div>

      {insights.length > 0 ? (
        <div className="mt-4 space-y-3">
          {insights.map((item, index) => (
            <div
              key={`${item.claim}-${index}`}
              className="rounded-lg border border-border/60 bg-secondary/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {item.claim}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${confidenceTone(
                      item.confidence,
                    )}`}
                  >
                    {formatConfidence(item.confidence)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityTone(
                      item.actionPriority,
                    )}`}
                  >
                    {item.actionPriority ?? "P2"}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{item.reasoning}</p>
              <div className="mt-3 space-y-2">
                {item.evidence.slice(0, 3).map((evidence, evidenceIndex) => (
                  <div
                    key={`${evidence.competitor}-${evidenceIndex}`}
                    className="rounded-md border border-border/60 bg-card/70 p-2"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {evidence.competitor}
                    </p>
                    <p className="mt-1 text-xs text-foreground/90">
                      {evidence.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Competitive insights are unavailable for this report.
        </p>
      )}
    </div>
  );
}
