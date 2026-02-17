"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";
import { PricingCheckoutCta } from "@/components/landing/PricingCheckoutCta";
import { fetchBillingEntitlement } from "@/features/billing/services/billingReturnClient";
import type { BillingPlan } from "@/features/billing/types/billing.types";

type Props = {
  plan: BillingPlan;
  planName: string;
  defaultLabel: string;
  highlighted: boolean;
  returnTo?: string;
};

const PLAN_RANK: Record<BillingPlan, number> = {
  starter: 1,
  pro: 2,
  growth: 3,
};

type Entitlement = {
  isEntitled: boolean;
  plan: BillingPlan | null;
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
  planName,
  defaultLabel,
  highlighted,
  returnTo,
}: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveState = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          if (!cancelled) {
            setEntitlement(null);
            setLoading(false);
          }
          return;
        }

        const result = await fetchBillingEntitlement();
        if (!cancelled) {
          setEntitlement({
            isEntitled: result.isEntitled,
            plan: result.plan,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setEntitlement(null);
          setLoading(false);
        }
      }
    };

    void resolveState();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const activePlan =
    entitlement?.isEntitled && entitlement.plan ? entitlement.plan : null;

  if (loading) {
    return <span className={getDisabledButtonClass()}>Checking...</span>;
  }

  if (!activePlan) {
    return (
      <PricingCheckoutCta
        plan={plan}
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
      label={`Upgrade to ${planName}`}
      highlighted={highlighted}
      returnTo={returnTo}
    />
  );
}

