import {
  LEMONSQUEEZY_API_KEY,
  LEMONSQUEEZY_GROWTH_VARIANT_ID,
  LEMONSQUEEZY_PRO_VARIANT_ID,
  LEMONSQUEEZY_STARTER_VARIANT_ID,
  LEMONSQUEEZY_STORE_ID,
} from "@/lib/env";
import { logger } from "@/lib/logger";
import type { BillingPlan } from "@/features/billing/types/billing.types";

type CheckoutUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type LemonCheckoutCreateParams = {
  plan: BillingPlan;
  checkoutRef: string;
  successUrl?: string;
};

const LEMONSQUEEZY_API_BASE = "https://api.lemonsqueezy.com/v1";

function resolveVariantId(plan: BillingPlan): string | null {
  if (plan === "starter") {
    return LEMONSQUEEZY_STARTER_VARIANT_ID ?? null;
  }

  if (plan === "pro") {
    return LEMONSQUEEZY_PRO_VARIANT_ID ?? null;
  }

  if (plan === "growth") {
    return LEMONSQUEEZY_GROWTH_VARIANT_ID ?? null;
  }

  return null;
}

function normalizeNumericId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

export async function createCheckoutUrl(
  params: LemonCheckoutCreateParams,
): Promise<CheckoutUrlResult> {
  const apiKey = LEMONSQUEEZY_API_KEY;
  const storeId = normalizeNumericId(LEMONSQUEEZY_STORE_ID ?? null);
  const variantId = normalizeNumericId(resolveVariantId(params.plan));

  if (!apiKey) {
    logger.error("Missing LemonSqueezy API key.");
    return { ok: false, error: "Checkout API key not configured" };
  }

  if (!storeId) {
    logger.error("Missing LemonSqueezy store id.");
    return { ok: false, error: "Checkout store not configured" };
  }

  if (!variantId) {
    logger.error("Missing LemonSqueezy variant id for plan.", undefined, {
      plan: params.plan,
    });
    return { ok: false, error: "Checkout variant not configured" };
  }

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: {
            checkout_ref: params.checkoutRef,
          },
        },
        ...(params.successUrl
          ? {
              product_options: {
                redirect_url: params.successUrl,
              },
            }
          : {}),
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };

  try {
    const response = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => null)) as
      | {
          data?: { attributes?: { url?: string } };
          errors?: Array<{ detail?: string }>;
        }
      | null;

    if (!response.ok) {
      logger.error("LemonSqueezy checkout create failed.", undefined, {
        plan: params.plan,
        status: response.status,
        detail: body?.errors?.[0]?.detail ?? "unknown",
      });
      return { ok: false, error: "Unable to create checkout session" };
    }

    const url = body?.data?.attributes?.url;
    if (!url) {
      logger.error("LemonSqueezy checkout response missing URL.", undefined, {
        plan: params.plan,
      });
      return { ok: false, error: "Checkout URL missing from provider response" };
    }

    return { ok: true, url };
  } catch (error) {
    logger.error("LemonSqueezy checkout request crashed.", error, {
      plan: params.plan,
    });
    return { ok: false, error: "Unable to reach checkout provider" };
  }
}
