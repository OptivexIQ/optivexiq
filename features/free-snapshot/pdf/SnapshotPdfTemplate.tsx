import Image from "next/image";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

export interface SnapshotPdfProps {
  report: ConversionGapReport;
  brand: {
    logoUrl: string;
    primaryColor: string;
    accentColor: string;
  };
  generatedAt: string;
}

export function SnapshotPdfTemplate({
  report,
  brand,
  generatedAt,
}: SnapshotPdfProps) {
  const topGaps = report.priorityIssues.slice(0, 3);
  const quickWins = report.rewriteRecommendations.slice(0, 5);
  const missingObjections = report.objectionCoverage.missing.slice(0, 3);
  const mitigationGuidance = report.objectionCoverage.guidance.slice(0, 3);

  return (
    <article className="snapshot-pdf mx-auto max-w-200 bg-white text-slate-900">
      <style>{`
        .snapshot-pdf {
          --brand-primary: ${brand.primaryColor};
          --brand-accent: ${brand.accentColor};
        }
      `}</style>
      <header className="border-b border-slate-200">
        <div className="h-2 w-full bg-(--brand-primary)" aria-hidden />
        <div className="flex items-start justify-between gap-6 px-10 py-8">
          <div className="space-y-4">
            <Image
              src={brand.logoUrl}
              alt="OptivexIQ logo"
              width={128}
              height={32}
              className="h-8 w-auto"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Free Conversion Audit
              </h1>
              <p className="text-sm text-slate-600">
                Website analyzed: {report.company}
              </p>
              <p className="text-sm text-slate-600">Generated: {generatedAt}</p>
            </div>
          </div>
          <div className="rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Confidential
          </div>
        </div>
      </header>

      <main className="space-y-8 px-10 py-8">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Executive Summary</h2>
          <p className="text-sm leading-6 text-slate-700">
            {report.executiveNarrative}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="inline-flex w-fit items-center rounded-full bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-white">
              Gap Score: {report.conversionScore}/100
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Revenue Impact Estimate
              </p>
              <p className="mt-1 text-base font-semibold">
                $
                {report.revenueImpact.projectedPipelineRecovery.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Score Grid</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Messaging Clarity
              </p>
              <p className="mt-1 text-xl font-semibold">
                {report.clarityScore}/100
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Objection Coverage
              </p>
              <p className="mt-1 text-xl font-semibold">
                {report.objectionCoverage.score}/100
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Competitive Differentiation
              </p>
              <p className="mt-1 text-xl font-semibold">
                {report.differentiationScore}/100
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Pricing Clarity
              </p>
              <p className="mt-1 text-xl font-semibold">
                {report.pricingScore}/100
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 page-break">
          <h2 className="text-lg font-semibold">Top Gaps</h2>
          <div className="space-y-3">
            {topGaps.map((gap) => (
              <article
                key={`${gap.issue}:${gap.priorityScore}`}
                className="rounded-xl border border-(--brand-primary) p-4"
              >
                <p className="text-sm font-semibold">{gap.issue}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                  Tier {gap.tier} • Priority {gap.priorityScore}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Objection Findings</h2>
          <div className="space-y-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Missing objections
              </p>
              {missingObjections.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {missingObjections.map((item) => (
                    <li key={`${item.objection}-${item.severity}`}>
                      {item.objection} ({item.severity})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-700">
                  No missing objections were detected.
                </p>
              )}
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Mitigation guidance
              </p>
              {mitigationGuidance.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {mitigationGuidance.map((item) => (
                    <li key={`${item.objection}-${item.recommendedStrategy}`}>
                      {item.objection}: {item.recommendedStrategy}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-700">
                  Guidance is not available for this snapshot.
                </p>
              )}
            </article>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Quick Wins</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {quickWins.map((win) => (
              <li key={win.slug} className="flex items-start gap-2">
                <span
                  className="mt-1 inline-block h-2 w-2 rounded-full bg-(--brand-accent)"
                  aria-hidden
                />
                <span>{win.copy}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-(--brand-primary) px-6 py-5 text-white page-break">
          <h2 className="text-lg font-semibold">
            Ready for Full Conversion Intelligence?
          </h2>
          <p className="mt-2 text-sm text-white/90">
            Upgrade to unlock full diagnostics, rewrite recommendations,
            positioning maps, and export-ready executive reports.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-10 py-6">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <p>OptivexIQ</p>
          <p>Report version v1</p>
          <p>Confidential</p>
        </div>
      </footer>
    </article>
  );
}
