import type { ConversionGapReport } from "@/features/reports/types/report.types";

function formatTier(
  tier: ConversionGapReport["priorityIssues"][number]["tier"],
) {
  if (tier === "Critical") {
    return "text-destructive";
  }

  if (tier === "High") {
    return "text-chart-4";
  }

  return "text-chart-3";
}

type PriorityIndexProps = {
  report: ConversionGapReport;
};

export function PriorityIndex({ report }: PriorityIndexProps) {
  if (!report.priorityIssues.length) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Priority index
        </p>
        <p className="mt-3 text-sm text-foreground">
          Priority issues will appear once analysis completes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Priority index
        </p>
        <p className="text-xs text-muted-foreground">
          Priority score = impact - effort
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {report.priorityIssues.map((item) => (
          <div
            key={item.issue}
            className="grid gap-3 rounded-lg border border-border/60 bg-secondary/40 p-4 md:grid-cols-[2fr_1fr_1fr_1fr]"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.issue}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Impact {item.impactScore} − Effort {item.effortEstimate}
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Priority {item.priorityScore}
            </div>
            <div className="text-xs text-muted-foreground">
              Effort {item.effortEstimate}
            </div>
            <div className={`text-xs font-semibold ${formatTier(item.tier)}`}>
              {item.tier}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
