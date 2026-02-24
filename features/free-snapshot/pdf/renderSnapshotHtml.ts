import {
  type SnapshotPdfProps,
} from "@/features/free-snapshot/pdf/SnapshotPdfTemplate";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "0";
}

function renderSnapshotBodyHtml(props: SnapshotPdfProps): string {
  const { report, brand, generatedAt } = props;
  const topGaps = report.priorityIssues.slice(0, 3);
  const quickWins = report.rewriteRecommendations.slice(0, 5);
  const missingObjections = report.objectionCoverage.missing.slice(0, 3);
  const mitigationGuidance = report.objectionCoverage.guidance.slice(0, 3);
  const differentiationInsights = report.differentiationInsights;

  const topGapsHtml = topGaps
    .map(
      (gap) => `
          <article class="rounded-xl border border-(--brand-primary) p-4">
            <p class="text-sm font-semibold">${escapeHtml(gap.issue)}</p>
            <p class="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
              Tier ${escapeHtml(gap.tier)} &bull; Priority ${gap.priorityScore}
            </p>
          </article>`,
    )
    .join("");

  const quickWinsHtml = quickWins
    .map(
      (win) => `
            <li class="flex items-start gap-2">
              <span
                class="mt-1 inline-block h-2 w-2 rounded-full bg-(--brand-accent)"
                aria-hidden
              ></span>
              <span>${escapeHtml(win.copy)}</span>
            </li>`,
    )
    .join("");

  const missingObjectionsHtml =
    missingObjections.length > 0
      ? `<ul class="mt-2 space-y-1 text-sm text-slate-700">
${missingObjections
  .map(
    (item) =>
      `  <li>${escapeHtml(item.objection)} (${escapeHtml(item.severity)})</li>`,
  )
  .join("\n")}
              </ul>`
      : `<p class="mt-2 text-sm text-slate-700">
                No missing objections were detected.
              </p>`;

  const mitigationGuidanceHtml =
    mitigationGuidance.length > 0
      ? `<ul class="mt-2 space-y-1 text-sm text-slate-700">
${mitigationGuidance
  .map(
    (item) =>
      `  <li>${escapeHtml(item.objection)}: ${escapeHtml(item.recommendedStrategy)}</li>`,
  )
  .join("\n")}
              </ul>`
      : `<p class="mt-2 text-sm text-slate-700">
                Guidance is not available for this snapshot.
              </p>`;

  const differentiationHtml = differentiationInsights
    ? `<section class="space-y-4">
          <h2 class="text-lg font-semibold">Differentiation Findings</h2>
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Narrative similarity score
            </p>
            <p class="mt-2 text-sm text-slate-700">${differentiationInsights.similarityScore}/100</p>
          </article>
          <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Top parity risks
            </p>
            ${
              differentiationInsights.parityRisks.length > 0
                ? `<ul class="mt-2 space-y-1 text-sm text-slate-700">
${differentiationInsights.parityRisks
  .slice(0, 3)
  .map((item) => `  <li>${escapeHtml(item)}</li>`)
  .join("\n")}
               </ul>`
                : `<p class="mt-2 text-sm text-slate-700">No parity risks identified.</p>`
            }
          </article>
        </section>`
    : "";

  return `<article class="snapshot-pdf mx-auto max-w-200 bg-white text-slate-900">
      <style>
        .snapshot-pdf {
          --brand-primary: ${escapeHtml(brand.primaryColor)};
          --brand-accent: ${escapeHtml(brand.accentColor)};
        }
      </style>
      <header class="border-b border-slate-200">
        <div class="h-2 w-full bg-(--brand-primary)" aria-hidden></div>
        <div class="flex items-start justify-between gap-6 px-10 py-8">
          <div class="space-y-4">
            <img
              src="${escapeHtml(brand.logoUrl)}"
              alt="OptivexIQ logo"
              width="128"
              height="32"
              class="h-8 w-auto"
            />
            <div class="space-y-1">
              <h1 class="text-2xl font-semibold tracking-tight">
                Free Conversion Audit
              </h1>
              <p class="text-sm text-slate-600">
                Website analyzed: ${escapeHtml(report.company)}
              </p>
              <p class="text-sm text-slate-600">Generated: ${escapeHtml(generatedAt)}</p>
            </div>
          </div>
          <div class="rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Confidential
          </div>
        </div>
      </header>

      <main class="space-y-8 px-10 py-8">
        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Executive Summary</h2>
          <p class="text-sm leading-6 text-slate-700">
            ${escapeHtml(report.executiveNarrative)}
          </p>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="inline-flex w-fit items-center rounded-full bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-white">
              Gap Score: ${report.conversionScore}/100
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Revenue Impact Estimate
              </p>
              <p class="mt-1 text-base font-semibold">
                $${formatNumber(report.revenueImpact.projectedPipelineRecovery)}
              </p>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Score Grid</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Messaging Clarity
              </p>
              <p class="mt-1 text-xl font-semibold">${report.clarityScore}/100</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Objection Coverage
              </p>
              <p class="mt-1 text-xl font-semibold">${report.objectionCoverage.score}/100</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Competitive Differentiation
              </p>
              <p class="mt-1 text-xl font-semibold">${report.differentiationScore}/100</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Pricing Clarity
              </p>
              <p class="mt-1 text-xl font-semibold">${report.pricingScore}/100</p>
            </div>
          </div>
        </section>

        <section class="space-y-4 page-break">
          <h2 class="text-lg font-semibold">Top Gaps</h2>
          <div class="space-y-3">
${topGapsHtml}
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Objection Findings</h2>
          <div class="space-y-3">
            <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Missing objections
              </p>
              ${missingObjectionsHtml}
            </article>

            <article class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Mitigation guidance
              </p>
              ${mitigationGuidanceHtml}
            </article>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Quick Wins</h2>
          <ul class="space-y-2 text-sm text-slate-700">
${quickWinsHtml}
          </ul>
        </section>

        ${differentiationHtml}

        <section class="rounded-2xl bg-(--brand-primary) px-6 py-5 text-white page-break">
          <h2 class="text-lg font-semibold">
            Ready for Full Conversion Intelligence?
          </h2>
          <p class="mt-2 text-sm text-white/90">
            Upgrade to unlock full diagnostics, rewrite recommendations,
            positioning maps, and export-ready executive reports.
          </p>
        </section>
      </main>

      <footer class="border-t border-slate-200 px-10 py-6">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <p>OptivexIQ</p>
          <p>Report version v1</p>
          <p>Confidential</p>
        </div>
      </footer>
    </article>`;
}

export function renderSnapshotHtml(props: SnapshotPdfProps): string {
  const markup = renderSnapshotBodyHtml(props);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OptivexIQ Free Conversion Audit</title>
    <style>
      @page { margin: 20mm; size: A4; }

      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
      }

      body {
        font-family:
          "IBM Plex Sans",
          "Inter",
          "Segoe UI",
          -apple-system,
          BlinkMacSystemFont,
          "Helvetica Neue",
          Arial,
          sans-serif;
        background: #ffffff;
        color: #0f172a;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .snapshot-root {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .page-break {
        break-before: page;
        page-break-before: always;
      }

      @media print {
        body {
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="snapshot-root">
      ${markup}
    </div>
  </body>
</html>`;
}
