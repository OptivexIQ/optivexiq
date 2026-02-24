import type { ConversionGapReport } from "@/features/reports/types/report.types";
import dynamic from "next/dynamic";
import { ReportHeader } from "@/features/reports/components/ReportHeader";
import { ExecutiveNarrativeSummary } from "@/features/reports/components/ExecutiveNarrativeSummary";
import { ConversionRiskIndicator } from "@/features/reports/components/ConversionRiskIndicator";
import { RevenueImpactPanel } from "@/features/reports/components/RevenueImpactPanel";
import { GapScoreCard } from "@/features/conversion-gap/components/GapScoreCard";
import { TopPriorityFixes } from "@/features/reports/components/diagnostics/TopPriorityFixes";
import { PriorityIndex } from "@/features/reports/components/PriorityIndex";
import { ObjectionCoverage } from "@/features/reports/components/diagnostics/ObjectionCoverage";
import { CompetitiveThreatLevel } from "@/features/reports/components/CompetitiveThreatLevel";
import { MessagingOverlap } from "@/features/reports/components/diagnostics/MessagingOverlap";
import { RewriteRecommendations } from "@/features/reports/components/execution/RewriteRecommendations";
import { WhatHappensIfUnchanged } from "@/features/reports/components/WhatHappensIfUnchanged";
import { ReportExportActions } from "@/features/reports/components/ReportExportActions";
import { CompetitiveMatrixPreview } from "@/features/reports/components/execution/CompetitiveMatrixPreview";
import { DifferentiationInsightsPanel } from "@/features/reports/components/execution/DifferentiationInsightsPanel";
import { CompetitiveInsightsPanel } from "@/features/reports/components/execution/CompetitiveInsightsPanel";

const PositioningMapPreview = dynamic(
  () =>
    import("@/features/reports/components/execution/PositioningMapPreview").then(
      (module) => module.PositioningMapPreview,
    ),
  {
    loading: () => (
      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="h-3 w-40 rounded-full bg-muted/70" />
        <div className="mt-3 h-4 w-64 rounded-full bg-muted/50" />
        <div className="mt-4 h-16 rounded-lg bg-secondary/40" />
      </div>
    ),
  },
);

type GapReportViewProps = {
  report: ConversionGapReport;
  exportRestricted?: boolean;
};

export function GapReportView({
  report,
  exportRestricted,
}: GapReportViewProps) {
  if (report.status !== "completed") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm font-semibold text-foreground/85">
            Analysis in progress
          </p>
          <p className="mt-2 text-sm text-foreground">
            We are processing your conversion gap report. Check back soon.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Status: {report.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <ReportHeader report={report} exportRestricted={exportRestricted} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_40rem]">
        <ExecutiveNarrativeSummary report={report} />
        <RevenueImpactPanel report={report} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GapScoreCard report={report} />
        <ConversionRiskIndicator report={report} />
        <CompetitiveThreatLevel report={report} />
        <TopPriorityFixes report={report} />
      </div>

      <PriorityIndex report={report} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <MessagingOverlap report={report} />
          <DifferentiationInsightsPanel report={report} />
          <CompetitiveInsightsPanel report={report} />
          <RewriteRecommendations report={report} />
        </div>
        <div className="flex flex-col gap-6">
          <ObjectionCoverage report={report} />
          <CompetitiveMatrixPreview report={report} />
          <PositioningMapPreview report={report} />
        </div>
      </div>

      <WhatHappensIfUnchanged report={report} />
      <ReportExportActions
        reportId={report.id}
        reportStatus={report.status}
        exportRestricted={exportRestricted}
      />
    </div>
  );
}
