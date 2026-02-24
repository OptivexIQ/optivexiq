import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { planSchema } from "@/features/billing/validators/planSchema";
import { startCheckoutForPlan } from "@/features/billing/services/checkoutStartService";
import { getSignUpRedirectUrl } from "@/features/billing/utils/checkoutNavigation";
import { parseCheckoutCurrency } from "@/features/billing/services/checkoutPolicyService";
import { logger } from "@/lib/logger";

type CheckoutPageProps = {
  searchParams?:
    | {
        plan?: string;
        currency?: string;
        returnTo?: string;
      }
    | Promise<{
        plan?: string;
        currency?: string;
        returnTo?: string;
      }>;
};

function sanitizeReturnTo(value: string | undefined): string | null {
  if (!value || !value.startsWith("/")) {
    return null;
  }
  return value;
}

function getCheckoutErrorCopy(code: string) {
  switch (code) {
    case "PLAN_LIMITS_UNAVAILABLE":
      return "Plan limits are temporarily unavailable. Please try again shortly.";
    case "SAME_PLAN_ACTIVE":
      return "Your selected plan is already active.";
    case "DOWNGRADE_OR_LATERAL":
      return "This checkout path only supports upgrades from your current plan.";
    case "CHECKOUT_SESSION_FAILED":
      return "We could not create a secure checkout session. Please try again.";
    case "CHECKOUT_PROVIDER_FAILED":
      return "Checkout is temporarily unavailable. Please contact support.";
    default:
      throw new Error(`Unknown checkout error code: ${code}`);
  }
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const resolvedParams = await Promise.resolve(searchParams);
  const parsedPlan = planSchema.safeParse(resolvedParams?.plan);
  if (!parsedPlan.success) {
    redirect("/#pricing");
  }

  const returnTo = sanitizeReturnTo(resolvedParams?.returnTo);
  const currency = parseCheckoutCurrency(resolvedParams?.currency) ?? "USD";
  const user = await getServerUser();

  if (!user) {
    const checkoutIntent = `/checkout?plan=${encodeURIComponent(
      parsedPlan.data,
    )}&currency=${encodeURIComponent(currency)}${
      returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
    }`;
    redirect(getSignUpRedirectUrl(checkoutIntent));
  }

  const checkout = await startCheckoutForPlan({
    userId: user.id,
    plan: parsedPlan.data,
    currency,
    returnTo: returnTo ?? undefined,
  });

  if (!checkout.ok) {
    const target = returnTo ?? "/#pricing";
    const message = getCheckoutErrorCopy(checkout.code);
    logger.warn("Marketing checkout initiation failed.", {
      user_id: user.id,
        requested_plan: parsedPlan.data,
        requested_currency: currency,
        return_to: target,
        reason_code: checkout.code,
        reason_message: checkout.message,
    });

    return (
      <section className="mx-auto max-w-2xl px-6 py-42">
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <h1 className="text-xl font-semibold text-foreground">
            Unable to start checkout
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/checkout?plan=${encodeURIComponent(parsedPlan.data)}&currency=${encodeURIComponent(currency)}${
                returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""
              }`}
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </Link>
            <Link
              href={target}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Back to pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Contact support
            </Link>
            {checkout.code === "DOWNGRADE_OR_LATERAL" ? (
              <Link
                href="/dashboard/billing"
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Go to Billing
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  redirect(checkout.url.toString());
}
