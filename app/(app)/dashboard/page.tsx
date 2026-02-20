import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardOverviewResult } from "@/features/reports/services/dashboardOverviewService";

export default async function DashboardPage() {
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {profileResult.error}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }

  const overviewResult = await getDashboardOverviewResult();
  if (!overviewResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Overview
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {overviewResult.error}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const overview = overviewResult.data;
  const usagePercent =
    !overview.summary.hasSubscription ||
    overview.summary.usageUnlimited ||
    overview.summary.usageLimit <= 0
      ? 0
      : Math.round(
          (overview.summary.usageUsed / overview.summary.usageLimit) * 100,
        );
  const usageLabel = overview.summary.hasSubscription
    ? overview.summary.usageUnlimited
      ? "Unlimited"
      : overview.summary.usageLimit.toString()
    : "No subscription";
  const usageBlocked =
    !overview.summary.hasSubscription ||
    (!overview.summary.usageUnlimited &&
      overview.summary.usageUsed >= overview.summary.usageLimit);
  const rewriteBlocked = !overview.summary.hasSubscription;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Overview
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {overview.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Track conversion risk, competitive overlap, and pipeline impact
              with data grounded in your ICP and pricing model.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            {usageBlocked ? (
              <p className="text-sm font-medium text-muted-foreground">
                Run new analysis unavailable
              </p>
            ) : (
              <Button asChild>
                <Link href="/dashboard/gap-engine">Run new analysis</Link>
              </Button>
            )}
            {usageBlocked ? (
              <p className="text-xs text-muted-foreground">
                {overview.summary.hasSubscription
                  ? "Usage limit reached. Upgrade or wait for the next cycle."
                  : "Subscription required to run analyses."}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium text-foreground/85">
            Conversion Gap Score
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-semibold text-foreground">
              {overview.summary.gapScore}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <Progress
            value={overview.summary.gapScore}
            variant="critical"
            className="mt-3 h-2"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Critical gaps in pricing clarity and differentiation.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium text-foreground/85">
            Active Reports
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl font-semibold text-foreground">
              {overview.summary.activeReports}
            </span>
            <Badge variant="secondary">Live</Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {overview.summary.usageUsed} of {usageLabel} used this cycle.
          </p>
          <Progress value={usagePercent} variant="info" className="mt-3 h-2" />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium text-foreground/85">
            Competitor Coverage
          </p>
          <div className="mt-3 text-2xl font-semibold text-foreground">
            {overview.summary.competitorCoverage}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Coverage across your top pricing alternatives.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-medium text-foreground/85">
            Conversion Focus
          </p>
          <div className="mt-3 text-2xl font-semibold text-foreground">
            {overview.summary.conversionFocus}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Optimizing for primary motion this quarter.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Recent Conversion Gap Reports
              </h2>
              <p className="text-xs text-muted-foreground">
                Executive summaries across your most recent analyses.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reports">View all</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Site analyzed</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.reports.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No reports yet. Run your first analysis to see results here.
                  </TableCell>
                </TableRow>
              ) : (
                overview.reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-foreground">
                      {report.site}
                    </TableCell>
                    <TableCell>{report.score}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.status === "Complete" ? "secondary" : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/reports">View report</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Recommended next action
          </p>
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            {overview.nextAction.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {overview.nextAction.description}
          </p>
          <div className="mt-6 rounded-lg border border-border/60 bg-secondary/40 p-4">
            <p className="text-sm font-medium text-foreground/85">
              Why this matters
            </p>
            <p className="mt-2 text-sm text-foreground">
              Pricing overlap is the fastest path to lost trials. Align your
              value anchors before expanding acquisition spend.
            </p>
          </div>
          {rewriteBlocked ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Run pricing rewrite unavailable
              </p>
              <p className="text-xs text-muted-foreground">
                Subscription required to run rewrites.
              </p>
            </div>
          ) : (
            <Button className="mt-6 w-full" asChild>
              <Link href="/dashboard/rewrites">Run pricing rewrite</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
