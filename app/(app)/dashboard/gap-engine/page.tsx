import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { getEngineDataResult } from "@/features/conversion-gap/services/engineDashboardService";
import { GapEngineForm } from "@/features/conversion-gap/components/GapEngineForm";
import { getDashboardOverviewResult } from "@/features/reports/services/dashboardOverviewService";
import { GapEngineStatusCard } from "@/features/conversion-gap/components/GapEngineStatusCard";
import { GapEngineStatusBadge } from "@/features/conversion-gap/components/GapEngineStatusBadge";
import { GapEngineLiveStatusProvider } from "@/features/conversion-gap/components/GapEngineLiveStatusProvider";

export default async function GapEnginePage() {
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    redirect("/dashboard/onboarding");
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
            Gap Engine
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Gap Engine unavailable
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

  const engineResult = await getEngineDataResult();
  if (!engineResult.ok) {
    return (
      <div className="flex w-full flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Gap Engine
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Gap Engine unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {engineResult.error}
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

  const engine = engineResult.data;

  return (
    <GapEngineLiveStatusProvider
      engineStatus={engine.status}
      latestReport={engine.latestReport}
    >
      <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Gap Engine
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {engine.headline}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Run a structured conversion audit across homepage and pricing to
              surface revenue gaps, not copy tweaks.
            </p>
          </div>
          <GapEngineStatusBadge />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <GapEngineForm
          defaultValues={engine.formDefaults}
          output={{ etaMinutes: engine.output.etaMinutes }}
          usageBlocked={usageBlocked}
          hasSubscription={overview.summary.hasSubscription}
        />

        <div className="flex flex-col gap-6">
          <GapEngineStatusCard etaMinutes={engine.output.etaMinutes} />

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <p className="text-sm font-medium text-foreground/85">
              {engine.output.headline}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              {engine.output.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-chart-3" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Uploads are queued if your competitor list exceeds 8 domains.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {engine.explainer.map((item) => (
            <div key={item.title} className="space-y-2">
                  <p className="text-sm font-semibold text-foreground/85">
                    {item.title}
                  </p>
              <p className="text-sm text-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </GapEngineLiveStatusProvider>
  );
}
