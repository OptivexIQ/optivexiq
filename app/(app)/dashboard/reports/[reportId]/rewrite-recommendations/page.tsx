import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Button } from "@/components/ui/button";
import { getGapReport } from "@/features/reports/services/reportService";
import { getRewriteRecommendationCards } from "@/features/reports/components/execution/RewriteRecommendations";
import { RewriteRecommendationsList } from "@/features/reports/components/execution/RewriteRecommendationsList";

type RewriteRecommendationsPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function RewriteRecommendationsPage({
  params,
}: RewriteRecommendationsPageProps) {
  const { reportId } = await params;
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    redirect("/dashboard/onboarding");
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }

  const result = await getGapReport(reportId);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Access denied
          </p>
          <p className="mt-2 text-sm text-foreground">
            You do not have access to this rewrite pack.
          </p>
          <div className="mt-4">
            <Button asChild variant="secondary">
              <Link href="/dashboard/reports">Back to reports</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Rewrite pack unavailable
          </p>
          <p className="mt-2 text-sm text-foreground">{result.message}</p>
        </div>
      </div>
    );
  }

  if (result.report.status !== "completed") {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Analysis in progress
          </p>
          <p className="mt-2 text-sm text-foreground">
            Rewrite recommendations will appear once the report is complete.
          </p>
        </div>
      </div>
    );
  }

  const cards = getRewriteRecommendationCards(result.report);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Rewrite recommendations
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            Suggested copy to close conversion gaps
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Action-ready rewrite guidance across the most important conversion
            touchpoints.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/dashboard/reports/${reportId}`}>
            Back to report
          </Link>
        </Button>
      </div>

      <RewriteRecommendationsList cards={cards} />
    </div>
  );
}
