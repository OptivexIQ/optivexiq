import type { ConversionGapReport } from "@/features/reports/types/report.types";

function hasMatrixData(matrix: Record<string, unknown>) {
  return Object.keys(matrix).length > 0;
}

type CompetitiveMatrixProps = {
  report: ConversionGapReport;
};

export function CompetitiveMatrix({ report }: CompetitiveMatrixProps) {
  const hasData = hasMatrixData(report.competitiveMatrix);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground/85">
          Competitive matrix
        </p>
        <p className="text-xs text-muted-foreground">Overlap risk indicator</p>
      </div>
      <div className="mt-4 rounded-lg border border-border/60 bg-secondary/40 p-4">
        {hasData ? (
          <p className="text-sm text-foreground">
            Competitive matrix details are available in the full report.
          </p>
        ) : (
          <p className="text-sm text-foreground">
            Matrix data will populate after analysis completes.
          </p>
        )}
      </div>
    </div>
  );
}
