import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { buildCompetitiveMatrixViewModel } from "@/features/conversion-gap/services/competitiveMatrixViewModelService";


type CompetitiveMatrixProps = {
  report: ConversionGapReport;
};

export function CompetitiveMatrix({ report }: CompetitiveMatrixProps) {
  const matrix = buildCompetitiveMatrixViewModel(report.competitiveMatrix);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground/85">
          Competitive matrix
        </p>
        <p className="text-xs text-muted-foreground">Overlap risk indicator</p>
      </div>
      <div className="mt-4 rounded-lg border border-border/60 bg-secondary/40 p-4">
        {matrix.hasData ? (
          <div className="space-y-4">
            {matrix.profileRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-card/80 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Competitor</th>
                      <th className="px-3 py-2 font-medium">Our advantage</th>
                      <th className="px-3 py-2 font-medium">Their advantage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.profileRows.map((row) => (
                      <tr key={`${row.competitor}-${row.ourAdvantage}`} className="border-t border-border/50">
                        <td className="px-3 py-2 text-foreground">{row.competitor}</td>
                        <td className="px-3 py-2 text-foreground/90">{row.ourAdvantage || "-"}</td>
                        <td className="px-3 py-2 text-foreground/90">{row.theirAdvantage || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {matrix.competitorRows.length > 0 ? (
              <div className="space-y-3">
                {matrix.competitorRows.slice(0, 3).map((row) => (
                  <div
                    key={row.competitor}
                    className="rounded-lg border border-border/60 bg-card/80 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {row.competitor}
                    </p>
                    {row.summary ? (
                      <p className="mt-2 text-sm text-foreground">{row.summary}</p>
                    ) : null}
                    <div className="mt-2 grid gap-2 text-xs text-foreground/90">
                      {row.strengths.length > 0 ? (
                        <p>Strengths: {row.strengths.slice(0, 2).join(", ")}</p>
                      ) : null}
                      {row.weaknesses.length > 0 ? (
                        <p>Weaknesses: {row.weaknesses.slice(0, 2).join(", ")}</p>
                      ) : null}
                      {row.positioning.length > 0 ? (
                        <p>Positioning: {row.positioning.slice(0, 2).join(", ")}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {(matrix.differentiators.length > 0 || matrix.counters.length > 0) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Differentiators
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-foreground">
                    {matrix.differentiators.length > 0 ? (
                      matrix.differentiators.slice(0, 3).map((item) => (
                        <p key={`${item.claim}-${item.proof}`}>
                          {item.claim}
                          {item.proof ? ` - ${item.proof}` : ""}
                        </p>
                      ))
                    ) : (
                      <p>No differentiators detected.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Counter-positioning
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-foreground">
                    {matrix.counters.length > 0 ? (
                      matrix.counters.slice(0, 3).map((item) => (
                        <p key={`${item.competitor}-${item.counter}`}>
                          {item.competitor}
                          {item.counter ? `: ${item.counter}` : ""}
                        </p>
                      ))
                    ) : (
                      <p>No counters generated.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {matrix.narratives.length > 0 ? (
              <div className="space-y-2">
                {matrix.narratives.map((item) => (
                  <div key={item.label} className="rounded-lg border border-border/60 bg-card/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-foreground">
            Matrix data will populate after analysis completes.
          </p>
        )}
      </div>
    </div>
  );
}
