"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import {
  parseCheckoutCurrency,
  parseCheckoutPlan,
} from "@/features/billing/services/checkoutPolicyService";
import { startCheckoutForUser } from "@/features/billing/services/checkoutStartService";

export async function startCheckoutAction(formData: FormData) {
  const user = await requireUser();
  const plan = parseCheckoutPlan(formData.get("plan"));
  const currency = parseCheckoutCurrency(formData.get("currency")) ?? "USD";

  if (!plan) {
    logger.warn("Invalid checkout plan requested.");
    redirect("/dashboard/billing");
  }

  const checkout = await startCheckoutForUser(user.id, plan, currency);
  if (!checkout.ok) {
    logger.warn("Blocked checkout by policy.", {
      user_id: user.id,
      requested_plan: plan,
      requested_currency: currency,
      reason: checkout.code,
    });
    redirect("/dashboard/billing");
  }

  redirect(checkout.url.toString());
}
