import {
  LEMONSQUEEZY_GROWTH_CHECKOUT_URL,
  LEMONSQUEEZY_PRO_CHECKOUT_URL,
  LEMONSQUEEZY_STARTER_CHECKOUT_URL,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import type { BillingPlan } from "@/features/billing/types/billing.types";

type CheckoutUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function getCheckoutBaseUrl(plan: BillingPlan): string | null {
  if (plan === "starter") {
    return LEMONSQUEEZY_STARTER_CHECKOUT_URL ?? null;
  }

  if (plan === "pro") {
    return LEMONSQUEEZY_PRO_CHECKOUT_URL ?? null;
  }

  if (plan === "growth") {
    return LEMONSQUEEZY_GROWTH_CHECKOUT_URL ?? null;
  }

  return null;
}

export function buildCheckoutUrl(
  plan: BillingPlan,
  checkoutRef: string,
): CheckoutUrlResult {
  const baseUrl = getCheckoutBaseUrl(plan);

  if (!baseUrl) {
    logger.error("Missing LemonSqueezy checkout URL for plan.", undefined, {
      plan,
    });
    return { ok: false, error: "Checkout URL not configured" };
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("checkout[custom][checkout_ref]", checkoutRef);
    return { ok: true, url: url.toString() };
  } catch (error) {
    logger.error("Failed to build LemonSqueezy checkout URL.", error, {
      plan,
    });
    return { ok: false, error: "Invalid checkout URL" };
  }
}
