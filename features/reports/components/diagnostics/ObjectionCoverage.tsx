import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConversionGapReport } from "@/features/reports/types/report.types";
import { extractObjectionCoverageScores } from "@/features/conversion-gap/services/objectionCoverageService";

function mapVariant(index: number) {
  const variants = [
    "critical-solid",
    "warning-solid",
    "performance",
    "critical-solid",
    "info-solid",
  ] as const;

  return variants[index % variants.length];
}

type ObjectionCoverageProps = {
  report: ConversionGapReport;
};

type CoverageValueProps = {
  value: number | string;
  variant?: ReturnType<typeof mapVariant>;
};

function coverageTone(variant: ReturnType<typeof mapVariant>) {
  switch (variant) {
    case "critical-solid":
      return "text-destructive";
    case "warning-solid":
      return "text-chart-4";
    case "performance":
      return "text-chart-3";
    case "info-solid":
      return "text-chart-2";
    default:
      return "text-muted-foreground";
  }
}

function CoverageValue({ value, variant }: CoverageValueProps) {
  return (
    <span className={variant ? coverageTone(variant) : "text-muted-foreground"}>
      {value}% Coverage
    </span>
  );
}

function severityWeight(
  severity: "low" | "medium" | "high" | "critical",
): number {
  if (severity === "critical") {
    return 4;
  }
  if (severity === "high") {
    return 3;
  }
  if (severity === "medium") {
    return 2;
  }
  return 1;
}

function severityClass(
  severity: "low" | "medium" | "high" | "critical",
): string {
  if (severity === "critical") {
    return "bg-destructive text-destructive-foreground";
  }
  if (severity === "high") {
    return "bg-chart-4 text-foreground";
  }
  if (severity === "medium") {
    return "bg-chart-2 text-foreground";
  }
  return "bg-secondary text-secondary-foreground";
}

function buildRewriteHref(input: {
  report: ConversionGapReport;
  objection: string;
  impact?: string;
  strategy?: string;
}) {
  const params = new URLSearchParams({
    rewriteType: "homepage",
    reportId: input.report.id,
    objection: input.objection,
  });
  if (input.impact && input.impact.trim().length > 0) {
    params.set("impact", input.impact.trim());
  }
  if (input.strategy && input.strategy.trim().length > 0) {
    params.set("strategy", input.strategy.trim());
  }
  return `/dashboard/rewrites?${params.toString()}`;
}

export function ObjectionCoverage({ report }: ObjectionCoverageProps) {
  const { objectionCoverage } = report;
  const entries = Object.entries(
    extractObjectionCoverageScores(objectionCoverage),
  );
  const hasDimensionCoverage = entries.length > 0;
  const lateFunnelRiskFromScores = entries.some(
    ([label, value]) => /risk reduction|trust/i.test(label) && Number(value) < 30,
  );
  const lateFunnelRisk = lateFunnelRiskFromScores || objectionCoverage.risks.length > 0;
  const missingBySeverity = [...objectionCoverage.missing].sort(
    (a, b) => severityWeight(b.severity) - severityWeight(a.severity),
  );
  const criticalMissing = missingBySeverity.filter(
    (item) => item.severity === "critical",
  );
  const surfacedMissing = criticalMissing.length > 0
    ? criticalMissing.slice(0, 3)
    : missingBySeverity.slice(0, 3);
  const evidenceItems = objectionCoverage.identified
    .filter(
      (item) => typeof item.evidence === "string" && item.evidence.trim().length > 0,
    )
    .slice(0, 3);
  const guidanceItems = objectionCoverage.guidance.slice(0, 4);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground/85">
            Objection coverage
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Late-funnel risk exposure: {lateFunnelRisk ? "Elevated" : "Contained"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">
            {objectionCoverage.score}
          </p>
          <p className="text-xs text-muted-foreground">Coverage score</p>
        </div>
      </div>

      <div className="mt-4">
        <Progress value={objectionCoverage.score} className="h-1.5" />
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Critical missing objections
          </p>
          {surfacedMissing.length > 0 ? (
            <div className="mt-2 space-y-2">
              {surfacedMissing.map((item) => (
                <div key={`${item.objection}-${item.severity}`} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{item.objection}</p>
                    <Badge className={severityClass(item.severity)}>{item.severity}</Badge>
                  </div>
                  {item.impact ? (
                    <p className="mt-2 text-xs text-muted-foreground">{item.impact}</p>
                  ) : null}
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={buildRewriteHref({
                          report,
                          objection: item.objection,
                          impact: item.impact,
                          strategy: objectionCoverage.guidance.find(
                            (guidance) =>
                              guidance.objection.trim().toLowerCase() ===
                              item.objection.trim().toLowerCase(),
                          )?.recommendedStrategy,
                        })}
                      >
                        Generate rewrite addressing this objection
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No missing objections detected in this report.
            </p>
          )}
        </div>

        {evidenceItems.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Evidence excerpts
            </p>
            <div className="mt-2 space-y-2">
              {evidenceItems.map((item) => (
                <div
                  key={`${item.objection}-${item.evidence}`}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-3"
                >
                  <p className="text-xs font-medium text-foreground/90">{item.objection}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {guidanceItems.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recommended mitigation actions
            </p>
            <div className="mt-2 space-y-2">
              {guidanceItems.map((item) => (
                <div
                  key={`${item.objection}-${item.recommendedStrategy}`}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-3"
                >
                  <p className="text-xs font-medium text-foreground/90">{item.objection}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.recommendedStrategy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {hasDimensionCoverage ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Coverage by dimension
            </p>
            <div className="mt-2 space-y-3">
              {entries.map(([label, value], index) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{label}</span>
                    <CoverageValue value={value} variant={mapVariant(index)} />
                  </div>
                  <Progress
                    value={Number(value)}
                    variant={mapVariant(index)}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
