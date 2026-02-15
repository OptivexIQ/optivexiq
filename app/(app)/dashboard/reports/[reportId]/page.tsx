import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GapReportView } from "@/features/conversion-gap/components/GapReportView";
import { getGapReportForUser } from "@/features/reports/services/gapReportReadService";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { ReportExecutionStatusCard } from "@/features/reports/components/ReportExecutionStatusCard";

type ReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  const { reportId } = await params;
  const user = await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    redirect("/dashboard/onboarding");
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }

  const settingsResult = await getUserSettings(user.id);
  const exportRestricted = settingsResult.ok
    ? settingsResult.settings.export_restricted
    : true;

  const reportExecution = await getGapReportForUser(reportId, user.id);
  if (!reportExecution) {
    notFound();
  }
  if (!reportExecution.report) {
    if (reportExecution.status === "completed") {
      return (
        <div className="flex w-full flex-col gap-6">
          <div className="rounded-xl border border-border/60 bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Report unavailable
            </p>
            <p className="mt-2 text-sm text-foreground">
              Report completed but could not be loaded due to invalid report data.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/gap-engine">Run new analysis</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/reports">Back to reports</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ReportExecutionStatusCard
        reportId={reportId}
        initialExecution={reportExecution}
      />
    );
  }

  return (
    <GapReportView
      report={reportExecution.report}
      exportRestricted={exportRestricted}
    />
  );
}
