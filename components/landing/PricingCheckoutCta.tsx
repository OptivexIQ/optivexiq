import Link from "next/link";
import type {
  BillingCurrency,
  BillingPlan,
} from "@/features/billing/types/billing.types";
import { getCheckoutIntentUrl } from "@/features/billing/utils/checkoutNavigation";

type Props = {
  plan: BillingPlan;
  currency: BillingCurrency;
  label: string;
  highlighted: boolean;
  returnTo?: string;
  hrefOverride?: string;
};

export function PricingCheckoutCta({
  plan,
  currency,
  label,
  highlighted,
  returnTo,
  hrefOverride,
}: Props) {
  const target = hrefOverride ?? getCheckoutIntentUrl(plan, returnTo, currency);

  const className = `block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200 ${
    highlighted
      ? "bg-primary text-primary-foreground shadow-md shadow-black/30 hover:bg-primary/90"
      : "border border-border bg-secondary text-foreground hover:bg-muted"
  }`;

  return (
    <div className="mb-8">
      <Link href={target} className={className}>
        {label}
      </Link>
    </div>
  );
}
