import { createCheckoutUrl } from "@/features/billing/services/lemonsqueezyService";
import {
  createPendingCheckoutSession,
  findRecentPendingCheckoutSession,
} from "@/features/billing/services/checkoutSessionService";
import {
  assertCheckoutPolicy,
  type CheckoutPlan,
} from "@/features/billing/services/checkoutPolicyService";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/env";
import type { BillingCurrency } from "@/features/billing/types/billing.types";

export type StartCheckoutResult =
  | { ok: true; url: URL; checkoutRef: string; reused: boolean }
  | { ok: false; code: string; message: string };

const RECENT_CHECKOUT_WINDOW_MINUTES = 5;

function sanitizeReturnTo(value?: string): string {
  if (!value || !value.startsWith("/")) {
    return "/#pricing";
  }
  return value;
}

function resolveBaseSiteUrl(): string {
  return NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function buildCheckoutRedirectUrls(checkoutRef: string, returnTo?: string) {
  const base = resolveBaseSiteUrl();
  const safeReturnTo = sanitizeReturnTo(returnTo);
  const success = new URL("/billing/return", base);
  success.searchParams.set("checkout_ref", checkoutRef);
  const cancel = new URL(safeReturnTo, base);
  return {
    successUrl: success.toString(),
    cancelUrl: cancel.toString(),
  };
}

export async function startCheckoutForPlan(params: {
  userId: string;
  plan: CheckoutPlan;
  currency?: BillingCurrency;
  returnTo?: string;
}): Promise<StartCheckoutResult> {
  const policy = await assertCheckoutPolicy({
    userId: params.userId,
    requestedPlan: params.plan,
  });
  if (!policy.ok) {
    return { ok: false, code: policy.code, message: policy.message };
  }

  const existingCheckoutRef = await findRecentPendingCheckoutSession({
    userId: params.userId,
    requestedPlan: params.plan,
    withinMinutes: RECENT_CHECKOUT_WINDOW_MINUTES,
  });

  let checkoutRef = existingCheckoutRef;
  if (!checkoutRef) {
    const checkoutSession = await createPendingCheckoutSession(
      params.userId,
      params.plan,
    );
    if (!checkoutSession.ok) {
      return {
        ok: false,
        code: "CHECKOUT_SESSION_FAILED",
        message: checkoutSession.error,
      };
    }
    checkoutRef = checkoutSession.checkoutRef;
  }

  if (!checkoutRef) {
    return {
      ok: false,
      code: "CHECKOUT_SESSION_FAILED",
      message: "Unable to create checkout session.",
    };
  }

  const redirectUrls = buildCheckoutRedirectUrls(checkoutRef, params.returnTo);
  const checkoutUrl = await createCheckoutUrl({
    plan: params.plan,
    currency: params.currency ?? "USD",
    checkoutRef,
    successUrl: redirectUrls.successUrl,
  });
  if (!checkoutUrl.ok) {
    return {
      ok: false,
      code: "CHECKOUT_PROVIDER_FAILED",
      message: checkoutUrl.error,
    };
  }

  return {
    ok: true,
    url: new URL(checkoutUrl.url),
    checkoutRef,
    reused: Boolean(existingCheckoutRef),
  };
}

export async function startCheckoutForUser(
  userId: string,
  requestedPlan: CheckoutPlan,
  currency?: BillingCurrency,
): Promise<StartCheckoutResult> {
  return startCheckoutForPlan({ userId, plan: requestedPlan, currency });
}
