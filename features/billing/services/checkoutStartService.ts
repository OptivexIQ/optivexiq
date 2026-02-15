import { buildCheckoutUrl } from "@/features/billing/services/lemonsqueezyService";
import { createPendingCheckoutSession } from "@/features/billing/services/checkoutSessionService";
import {
  assertCheckoutPolicy,
  type CheckoutPlan,
} from "@/features/billing/services/checkoutPolicyService";

export type StartCheckoutResult =
  | { ok: true; url: URL }
  | { ok: false; code: string; message: string };

export async function startCheckoutForUser(
  userId: string,
  requestedPlan: CheckoutPlan,
): Promise<StartCheckoutResult> {
  const policy = await assertCheckoutPolicy({
    userId,
    requestedPlan,
  });
  if (!policy.ok) {
    return { ok: false, code: policy.code, message: policy.message };
  }

  const checkoutSession = await createPendingCheckoutSession(userId, requestedPlan);
  if (!checkoutSession.ok) {
    return {
      ok: false,
      code: "CHECKOUT_SESSION_FAILED",
      message: checkoutSession.error,
    };
  }

  const checkoutUrl = buildCheckoutUrl(requestedPlan, checkoutSession.checkoutRef);
  if (!checkoutUrl.ok) {
    return { ok: false, code: "CHECKOUT_URL_FAILED", message: checkoutUrl.error };
  }

  return { ok: true, url: new URL(checkoutUrl.url) };
}
