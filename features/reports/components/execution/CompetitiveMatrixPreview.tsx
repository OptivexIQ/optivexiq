import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { buildCompetitiveMatrixViewModel } from "@/features/conversion-gap/services/competitiveMatrixViewModelService";

type CompetitiveMatrixPreviewProps = {
  report: ConversionGapReport;
};

export function CompetitiveMatrixPreview({
  report,
}: CompetitiveMatrixPreviewProps) {
  const matrix = buildCompetitiveMatrixViewModel(report.competitiveMatrix);
  const competitorCoverage = matrix.competitorRows.length;
  const advantageCoverage = matrix.profileRows.length;
  const topNarrative = matrix.narratives[0]?.value ?? null;
  const parityRiskCount = report.differentiationInsights?.parityRisks.length ?? 0;
  const topParityRisk = report.differentiationInsights?.parityRisks[0] ?? null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground/85">
            Competitive matrix preview
          </p>
          <p className="mt-2 text-sm text-foreground">
            Snapshot of direct competitor advantage overlap and counter-positioning.
          </p>
        </div>
      </div>

      {matrix.hasData ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Competitors mapped
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {competitorCoverage}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Advantage comparisons
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {advantageCoverage}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Parity risk zones
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {parityRiskCount}
            </p>
          </div>
          {topNarrative ? (
            <div className="sm:col-span-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Key insight
              </p>
              <p className="mt-1 text-sm text-foreground">{topNarrative}</p>
            </div>
          ) : null}
          {topParityRisk ? (
            <div className="sm:col-span-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Highest parity pressure
              </p>
              <p className="mt-1 text-sm text-foreground">{topParityRisk}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-foreground">
          Matrix data will populate after analysis completes.
        </p>
      )}

      <Button asChild variant="secondary" className="mt-4 w-full">
        <Link href={`/dashboard/reports/${report.id}/competitive-matrix`}>
          View Full Competitive Matrix
        </Link>
      </Button>
    </div>
  );
}
