import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { getProfile } from "@/features/saas-profile/services/profileService";
import { isProfileComplete } from "@/features/saas-profile/validators/profileSchema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, CreditCard, Shield } from "lucide-react";
import { getBillingData } from "@/features/billing/services/billingDataService";
import { openBillingPortalAction } from "@/app/actions/billing/openBillingPortal";
import { startCheckoutAction } from "@/app/actions/billing/startCheckout";
import type { BillingTier } from "@/data/billingPlan";

function formatTierPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

const PLAN_RANK: Record<BillingTier["planKey"], number> = {
  starter: 0,
  pro: 1,
  growth: 2,
};

function resolveTierActionLabel(
  tier: BillingTier,
  currentPlanKey: BillingTier["planKey"],
  isCurrentTier: boolean,
) {
  if (isCurrentTier) {
    return "Manage plan";
  }

  return PLAN_RANK[tier.planKey] > PLAN_RANK[currentPlanKey]
    ? "Upgrade"
    : "Select plan";
}

export default async function BillingPage() {
  await requireUser();
  const profileResult = await getProfile();

  if (!profileResult.ok) {
    redirect("/dashboard/onboarding");
  }

  const profile = profileResult.data;

  if (!isProfileComplete(profile)) {
    redirect("/dashboard/onboarding");
  }

  const billingResult = await getBillingData();
  if (!billingResult.ok) {
    return (
      <div className="flex w-full flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Billing
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Billing unavailable
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {billingResult.error}
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

  const billing = billingResult.data;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Billing
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {billing.headline}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage your plan and usage so revenue intelligence stays aligned with
          your growth stage.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Current plan
              </p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {billing.currentPlan.name}
              </h2>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{billing.currentPlan.seats}</span>
                <Circle className="h-1.5 w-1.5 fill-current stroke-0 text-muted-foreground/70" />
                <span>{billing.currentPlan.renewalLabel}</span>
              </p>
            </div>
            <Badge variant="secondary">{billing.currentPlan.status}</Badge>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  Conversion reports
                  {billing.usage.reportsUnlimited ? (
                    <Badge variant="outline">Unlimited</Badge>
                  ) : null}
                </span>
                <span>
                  {billing.usage.reportsUsed}/{billing.usage.reportsLimitLabel}
                </span>
              </div>
              <Progress
                value={billing.usage.reportsPercent}
                variant="info"
                className="mt-2 h-2"
              />
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Competitor analyses</span>
                <span>
                  {billing.usage.competitorAnalyses}/
                  {billing.usage.competitorLimitLabel}
                </span>
              </div>
              <Progress
                value={billing.usage.competitorPercent}
                variant="info"
                className="mt-2 h-2"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={openBillingPortalAction}>
              <Button type="submit">
                <CreditCard className="h-4 w-4" />
                Update billing
              </Button>
            </form>
            <form action={openBillingPortalAction}>
              <Button type="submit" variant="outline">
                Download invoices
              </Button>
            </form>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Trust & data protection
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We prioritize secure infrastructure and responsible data
                  handling.
                </p>
              </div>
            </div>
          <div className="mt-4 space-y-2">
            {billing.trust.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-chart-3" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {billing.tiers.map((tier) => {
          const isCurrentTier = Boolean(tier.highlighted);
          const actionLabel = resolveTierActionLabel(
            tier,
            billing.currentPlan.key,
            isCurrentTier,
          );

          return (
            <div
              key={tier.name}
              className={`rounded-xl border border-border/60 bg-card p-6 ${
                isCurrentTier ? "border-primary/60" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>
                {isCurrentTier ? (
                  <Badge variant="secondary">Current</Badge>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground">
                  {formatTierPrice(tier.priceCents, tier.currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tier.period}
                </span>
              </div>
              {isCurrentTier ? (
                <form action={openBillingPortalAction} className="mt-4">
                  <Button className="w-full" type="submit">
                    {actionLabel}
                  </Button>
                </form>
              ) : (
                <form action={startCheckoutAction} className="mt-4">
                  <input type="hidden" name="plan" value={tier.planKey} />
                  <input type="hidden" name="currency" value={tier.currency} />
                  <Button className="w-full" type="submit" variant="outline">
                    {actionLabel}
                  </Button>
                </form>
              )}
              <div className="mt-5 space-y-2">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-chart-3" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
