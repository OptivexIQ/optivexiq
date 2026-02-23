import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardOverviewResult } from "@/features/reports/services/dashboardOverviewService";

export default async function ReportsPage() {
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Reports
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Reports unavailable
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
            Reports
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Reports unavailable
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
  const usageBlocked =
    !overview.summary.hasSubscription ||
    (!overview.summary.usageUnlimited &&
      overview.summary.usageUsed >= overview.summary.usageLimit);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Reports
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Conversion Gap Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Executive summaries from every analysis run in this workspace.
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

      <div className="rounded-xl border border-border/60 bg-card p-5">
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
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/reports/${report.id}`}>
                          View report
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/reports/${report.id}/compare`}>
                          Compare
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
