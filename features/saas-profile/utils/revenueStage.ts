import type { BillingCurrency } from "@/features/billing/types/billing.types";
import { formatRevenueStageLabel as formatRevenueStageLabelByCurrency } from "@/features/saas-profile/utils/monetaryLabels";

export function formatRevenueStageLabel(
  value: string | null | undefined,
  fallback: string,
  currency: BillingCurrency = "USD",
): string {
  return formatRevenueStageLabelByCurrency(value, currency, fallback);
}
