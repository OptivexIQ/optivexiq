import Link from "next/link";
import { PricingCheckoutCta } from "@/components/landing/PricingCheckoutCta";
import type {
  BillingCurrency,
  BillingPlan,
} from "@/features/billing/types/billing.types";
import {
  getCheckoutIntentUrl,
  getSignUpRedirectUrl,
} from "@/features/billing/utils/checkoutNavigation";

type Props = {
  plan: BillingPlan;
  currency: BillingCurrency;
  planName: string;
  defaultLabel: string;
  highlighted: boolean;
  returnTo?: string;
  isAuthenticated: boolean;
  activePlan: BillingPlan | null;
};

const PLAN_RANK: Record<BillingPlan, number> = {
  starter: 1,
  pro: 2,
  growth: 3,
};

function getRelation(activePlan: BillingPlan, targetPlan: BillingPlan) {
  if (activePlan === targetPlan) {
    return "current";
  }

  if (PLAN_RANK[targetPlan] > PLAN_RANK[activePlan]) {
    return "upgrade";
  }

  return "downgrade";
}

function getButtonClass(highlighted: boolean) {
  return `mb-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
    highlighted
      ? "bg-primary text-primary-foreground shadow-md shadow-black/30 hover:bg-primary/90"
      : "border border-border bg-secondary text-foreground hover:bg-muted"
  }`;
}

function getDisabledButtonClass() {
  return "mb-8 block w-full cursor-not-allowed rounded-xl border border-border bg-secondary py-3 text-center text-sm font-semibold text-muted-foreground opacity-70";
}

export function PricingPlanAction({
  plan,
  currency,
  planName,
  defaultLabel,
  highlighted,
  returnTo,
  isAuthenticated,
  activePlan,
}: Props) {
  if (!isAuthenticated) {
    const checkoutIntent = getCheckoutIntentUrl(plan, returnTo, currency);
    return (
      <PricingCheckoutCta
        plan={plan}
        currency={currency}
        label={defaultLabel}
        highlighted={highlighted}
        returnTo={returnTo}
        hrefOverride={getSignUpRedirectUrl(checkoutIntent)}
      />
    );
  }

  if (!activePlan) {
    return (
      <PricingCheckoutCta
        plan={plan}
        currency={currency}
        label={defaultLabel}
        highlighted={highlighted}
        returnTo={returnTo}
      />
    );
  }

  const relation = getRelation(activePlan, plan);
  if (relation === "current") {
    return <span className={getDisabledButtonClass()}>Current plan</span>;
  }

  if (relation === "downgrade") {
    return (
      <div className="mb-8">
        <Link href="/dashboard/billing" className={getButtonClass(highlighted)}>
          Manage in Billing
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          Downgrades are managed in Billing and take effect at renewal.
        </p>
      </div>
    );
  }

  return (
    <PricingCheckoutCta
      plan={plan}
      currency={currency}
      label={`Upgrade to ${planName}`}
      highlighted={highlighted}
      returnTo={returnTo}
    />
  );
}
