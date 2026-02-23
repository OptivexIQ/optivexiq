import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";
import { getReportDiffForUser } from "@/features/reports/services/reportDiffService";

type ComparePageProps = {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<{ compareTo?: string | string[] }>;
};

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ReportComparePage({
  params,
  searchParams,
}: ComparePageProps) {
  const { reportId } = await params;
  const resolvedSearchParams = (await Promise.resolve(searchParams)) ?? {};
  const compareTo = Array.isArray(resolvedSearchParams.compareTo)
    ? resolvedSearchParams.compareTo[0]
    : resolvedSearchParams.compareTo;

  const user = await requireUser();
  const profileResult = await getProfile();
  if (!profileResult.ok || !isProfileComplete(profileResult.data)) {
    redirect("/dashboard/onboarding");
  }

  const result = await getReportDiffForUser({
    reportId,
    userId: user.id,
    baselineReportId: compareTo,
  });

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have access to this comparison.
        </p>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>
    );
  }

  if (result.status === "conflict") {
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Comparison unavailable
        </h1>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/gap-engine">Run new analysis</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex w-full flex-col gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Comparison failed
        </h1>
        <p className="text-sm text-muted-foreground">{result.message}</p>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
        </Button>
      </div>
    );
  }

  const diff = result.payload;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Report comparison
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Current run vs baseline
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Report {diff.reportId} compared with {diff.baselineReportId}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/dashboard/reports/${reportId}`}>Back to report</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/reports">All reports</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Conversion score
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDelta(diff.summary.conversionScore.delta)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Funnel risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDelta(diff.summary.funnelRisk.delta)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Differentiation
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDelta(diff.summary.differentiationScore.delta)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Est. lift %
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDelta(diff.summary.estimatedLiftPercent.delta)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Pipeline at risk
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(diff.summary.pipelineAtRisk.delta)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold text-foreground/85">Diagnosis shift</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {diff.diagnosis.changed
              ? "Primary gap changed between runs."
              : "Primary gap stayed consistent."}
          </p>
          <p className="mt-3 text-sm text-foreground">
            Current: {diff.diagnosis.currentPrimaryGap}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Baseline: {diff.diagnosis.baselinePrimaryGap}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold text-foreground/85">
            Messaging overlap delta
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatDelta(diff.messagingOverlap.deltaCount)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {diff.messagingOverlap.currentCount} current vs{" "}
            {diff.messagingOverlap.baselineCount} baseline overlap items.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold text-foreground/85">
            Objection coverage improved
          </p>
          <p className="mt-3 text-sm text-foreground">
            {diff.objectionCoverage.improved.length > 0
              ? diff.objectionCoverage.improved.join(", ")
              : "None"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold text-foreground/85">
            Objection coverage declined
          </p>
          <p className="mt-3 text-sm text-foreground">
            {diff.objectionCoverage.declined.length > 0
              ? diff.objectionCoverage.declined.join(", ")
              : "None"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold text-foreground/85">
            Matrix structure delta
          </p>
          <p className="mt-3 text-sm text-foreground">
            Competitors {formatDelta(diff.competitiveMatrix.competitorRows.delta)},
            differentiators {formatDelta(diff.competitiveMatrix.differentiators.delta)},
            counters {formatDelta(diff.competitiveMatrix.counters.delta)}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="text-sm font-semibold text-foreground/85">
          Rewrite recommendation drift
        </p>
        <p className="mt-3 text-sm text-foreground">
          Added:{" "}
          {diff.rewriteRecommendations.added.length > 0
            ? diff.rewriteRecommendations.added.join(", ")
            : "None"}
        </p>
        <p className="mt-2 text-sm text-foreground">
          Removed:{" "}
          {diff.rewriteRecommendations.removed.length > 0
            ? diff.rewriteRecommendations.removed.join(", ")
            : "None"}
        </p>
      </div>
    </div>
  );
}
