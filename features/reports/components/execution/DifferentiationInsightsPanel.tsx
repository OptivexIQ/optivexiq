import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";

type DifferentiationInsightsPanelProps = {
  report: ConversionGapReport;
};

function riskLabel(score: number): "Low" | "Moderate" | "High" {
  if (score >= 70) {
    return "High";
  }
  if (score >= 40) {
    return "Moderate";
  }
  return "Low";
}

function riskClasses(score: number): string {
  if (score >= 70) {
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }
  if (score >= 40) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

function impactClasses(value: "low" | "medium" | "high"): string {
  if (value === "high") {
    return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  }
  if (value === "medium") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
}

function difficultyClasses(value: "low" | "medium" | "high"): string {
  if (value === "high") {
    return "border-violet-500/40 bg-violet-500/10 text-violet-200";
  }
  if (value === "medium") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-200";
  }
  return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
}

function buildRewriteHref(input: {
  reportId: string;
  theme: string;
  rationale: string;
  expectedImpact: "low" | "medium" | "high";
  implementationDifficulty: "low" | "medium" | "high";
}) {
  const params = new URLSearchParams({
    rewriteType: "homepage",
    reportId: input.reportId,
    theme: input.theme,
    rationale: input.rationale,
    expectedImpact: input.expectedImpact,
    implementationDifficulty: input.implementationDifficulty,
  });
  return `/dashboard/rewrites?${params.toString()}`;
}

export function DifferentiationInsightsPanel({
  report,
}: DifferentiationInsightsPanelProps) {
  const insights = report.differentiationInsights;

  if (!insights) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <p className="text-sm font-semibold text-foreground/85">
          Differentiation opportunities
        </p>
        <p className="mt-2 text-sm text-foreground">
          Differentiation insights are unavailable for this report.
        </p>
      </div>
    );
  }

  const parityRisk = riskLabel(insights.similarityScore);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground/85">
            Differentiation opportunities
          </p>
          <p className="mt-2 text-sm text-foreground">
            Decision-grade positioning actions based on overlap, parity risk, and defensible signals.
          </p>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses(
            insights.similarityScore,
          )}`}
        >
          Parity risk: {parityRisk} ({insights.similarityScore}/100)
        </div>
      </div>

      {insights.parityRisks.length > 0 ? (
        <div className="mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            High-risk parity zones
          </p>
          <div className="mt-2 space-y-1 text-sm text-foreground">
            {insights.parityRisks.slice(0, 4).map((risk) => (
              <p key={risk}>{risk}</p>
            ))}
          </div>
        </div>
      ) : null}

      {insights.opportunities.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {insights.opportunities.map((item) => (
            <div
              key={`${item.theme}-${item.rationale}`}
              className="rounded-lg border border-border/60 bg-secondary/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.theme}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${impactClasses(
                      item.expectedImpact,
                    )}`}
                  >
                    Impact: {item.expectedImpact}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${difficultyClasses(
                      item.implementationDifficulty,
                    )}`}
                  >
                    Difficulty: {item.implementationDifficulty}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{item.rationale}</p>
              <div className="mt-3">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={buildRewriteHref({
                      reportId: report.id,
                      theme: item.theme,
                      rationale: item.rationale,
                      expectedImpact: item.expectedImpact,
                      implementationDifficulty: item.implementationDifficulty,
                    })}
                  >
                    Generate positioning rewrite
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {insights.strategyRecommendations.length > 0 ? (
        <div className="mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Strategic guidance
          </p>
          <div className="mt-2 space-y-1 text-sm text-foreground">
            {insights.strategyRecommendations.map((recommendation) => (
              <p key={recommendation}>{recommendation}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
