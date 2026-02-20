"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/services/supabase/browser";
import type {
  BillingCurrency,
  BillingPlan,
} from "@/features/billing/types/billing.types";
import {
  getCheckoutIntentUrl,
  getLoginRedirectUrl,
} from "@/features/billing/utils/checkoutNavigation";

type Props = {
  plan: BillingPlan;
  currency: BillingCurrency;
  label: string;
  highlighted: boolean;
  returnTo?: string;
};

export function PricingCheckoutCta({
  plan,
  currency,
  label,
  highlighted,
  returnTo,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isChecking, setIsChecking] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setIsChecking(true);
    try {
      const { data } = await supabase.auth.getSession();
      setIsChecking(false);
      setIsRouting(true);
      const intentUrl = getCheckoutIntentUrl(plan, returnTo, currency);
      const target = data.session?.user ? intentUrl : getLoginRedirectUrl(intentUrl);
      router.push(target);
    } catch {
      setIsChecking(false);
      setIsRouting(false);
      setError("Unable to route to checkout. Please try again.");
    }
  };

  const isBusy = isChecking || isRouting;

  const className = `block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
    highlighted
      ? "bg-primary text-primary-foreground shadow-md shadow-black/30 hover:bg-primary/90"
      : "border border-border bg-secondary text-foreground hover:bg-muted"
  }`;

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isBusy}
        className={className}
      >
        <span className="inline-flex items-center gap-2">
          {isBusy ? (
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
          ) : null}
          <span>{label}</span>
        </span>
      </button>
      {error ? (
        <p className="mt-2 text-xs text-destructive">
          {error}{" "}
          <button
            type="button"
            onClick={() => void handleClick()}
            className="underline underline-offset-2"
          >
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}
