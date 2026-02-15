import type { ConversionGapReport } from "@/features/reports/types/report.types";

type TopPriorityFixesProps = {
  report: ConversionGapReport;
};

function impactTone(label: "Critical" | "Medium" | "Low") {
  if (label === "Critical") {
    return "border-destructive/40 bg-destructive/10 text-destructive";
  }

  if (label === "Medium") {
    return "border-chart-4/40 bg-chart-4/10 text-chart-4";
  }

  return "border-chart-3/40 bg-chart-3/10 text-chart-3";
}

function impactLabel(
  tier: ConversionGapReport["priorityIssues"][number]["tier"],
): "Critical" | "Medium" | "Low" {
  if (tier === "Critical") {
    return "Critical";
  }

  if (tier === "High") {
    return "Medium";
  }

  return "Low";
}

export function TopPriorityFixes({ report }: TopPriorityFixesProps) {
  const topItems = [...report.priorityIssues]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Top priority fixes
      </p>
      <div className="mt-4 space-y-3">
        {topItems.length ? (
          topItems.map((item, index) => {
            const label = impactLabel(item.tier);
            return (
              <div
                key={item.issue}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-foreground">
                  {index + 1}. {item.issue}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${impactTone(label)}`}
                >
                  {label}
                </span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-foreground">
            Top fixes will appear once analysis completes.
          </p>
        )}
      </div>
    </div>
  );
}
