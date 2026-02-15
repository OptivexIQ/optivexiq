"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { LEMONSQUEEZY_PORTAL_URL } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getSubscription } from "@/features/billing/services/planValidationService";

const DEFAULT_PORTAL_URL = "https://app.lemonsqueezy.com/my-orders";

export async function openBillingPortalAction() {
  const user = await requireUser();

  const subscription = await getSubscription(user.id);
  if (!subscription || !subscription.lemonsqueezy_customer_id) {
    logger.warn("Missing LemonSqueezy customer for portal access.", {
      user_id: user.id,
    });
    redirect("/dashboard/billing");
  }

  const portalUrl = LEMONSQUEEZY_PORTAL_URL ?? DEFAULT_PORTAL_URL;

  try {
    new URL(portalUrl);
  } catch (error) {
    logger.error("Invalid LemonSqueezy portal URL.", error, {
      portalUrl,
    });
    redirect("/dashboard/billing");
  }

  redirect(portalUrl);
}
