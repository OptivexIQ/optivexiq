# Pricing Currency Setup Runbook (USD/EUR/GBP)

This document covers everything needed on your side to complete multi-currency pricing setup for OptivexIQ.

## What is already implemented in code

- Marketing pricing display supports fixed regional price books for:
  - `USD`
  - `EUR`
  - `GBP`
- Checkout intent now carries `currency`.
- Server validates currency and resolves checkout variant by `plan + currency`.
- If currency-specific variant is missing, checkout falls back to base plan variant ID.

## Currency policy now used

- Regional pricing is fixed by market (not live FX conversion).
- Supported currencies: `USD`, `EUR`, `GBP`.
- Fallback currency: `USD`.

## Required LemonSqueezy setup

For each self-serve plan, create variants for each currency you want to charge:

- `starter`: USD, EUR, GBP
- `pro`: USD, EUR, GBP

If you skip some currency variants, fallback logic uses the base plan variant ID.

## Environment variables to set

## Required existing keys

- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_STARTER_VARIANT_ID`
- `LEMONSQUEEZY_PRO_VARIANT_ID`

Recommended: set base variant IDs to your default billing currency (typically EUR or USD).

## Optional currency-specific keys (new)

- `LEMONSQUEEZY_STARTER_USD_VARIANT_ID`
- `LEMONSQUEEZY_STARTER_GBP_VARIANT_ID`
- `LEMONSQUEEZY_PRO_USD_VARIANT_ID`
- `LEMONSQUEEZY_PRO_GBP_VARIANT_ID`

Note:
- EUR uses base variant IDs (`LEMONSQUEEZY_*_VARIANT_ID`), so there are no separate `*_EUR_*` keys.

## Suggested mapping table

- Starter EUR -> `LEMONSQUEEZY_STARTER_VARIANT_ID`
- Starter USD -> `LEMONSQUEEZY_STARTER_USD_VARIANT_ID`
- Starter GBP -> `LEMONSQUEEZY_STARTER_GBP_VARIANT_ID`
- Pro EUR -> `LEMONSQUEEZY_PRO_VARIANT_ID`
- Pro USD -> `LEMONSQUEEZY_PRO_USD_VARIANT_ID`
- Pro GBP -> `LEMONSQUEEZY_PRO_GBP_VARIANT_ID`

## Deployment steps

1. Create/confirm LemonSqueezy variants for Starter and Pro plan currencies.
2. Add the env vars above in your hosting provider (and local `.env.local` if needed).
3. Redeploy application.
4. Confirm checkout starts successfully for each currency.
5. Confirm Growth Intelligence routes to `/contact?intent=growth` instead of checkout.

## Verification checklist

## Marketing pricing

1. Open `/` and scroll to pricing.
2. Confirm displayed currency defaults by locale:
   - US locale -> USD
   - UK locale -> GBP
   - Core EU locale -> EUR

## Checkout behavior

1. Click a plan CTA from pricing section.
2. Confirm URL includes `currency` in checkout intent path:
   - `/checkout?plan=pro&currency=USD` (example)
3. Complete redirect to LemonSqueezy.
4. Confirm charged currency matches expected variant.

## Dashboard billing behavior

1. Open `/dashboard/billing`.
2. Click upgrade/select plan.
3. Confirm submitted checkout honors plan currency from billing tier data.

## API path validation (optional)

- `POST /api/lemonsqueezy/checkout` now supports optional `currency` in payload.

## Troubleshooting

- Symptom: wrong currency in checkout.
  - Cause: missing currency-specific variant env var.
  - Fix: set matching `LEMONSQUEEZY_*_<CURRENCY>_VARIANT_ID`.

- Symptom: checkout fails with variant/config error.
  - Cause: invalid or missing variant/store/api key.
  - Fix: verify numeric variant IDs and store ID in env.

- Symptom: pricing shows one currency, checkout charges another.
  - Cause: missing currency variant causing fallback to base variant.
  - Fix: configure currency-specific variant IDs for that plan.

## Current non-goals

- No Nigeria-specific price book yet (intentionally skipped).
- No end-user currency switcher UI yet (currency is locale-driven).

## Recommended next step (optional)

- Add an explicit pricing currency switcher (`USD/EUR/GBP`) so users can override locale defaults before checkout.
