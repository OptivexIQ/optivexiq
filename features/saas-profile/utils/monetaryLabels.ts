import type { BillingCurrency } from "@/features/billing/types/billing.types";
import type {
  AcvRangeValue,
  RevenueStageValue,
} from "@/features/saas-profile/constants/profileEnums";

const CURRENCY_SYMBOL: Record<BillingCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

function symbol(currency: BillingCurrency) {
  return CURRENCY_SYMBOL[currency];
}

export function formatAcvRangeLabel(
  value: AcvRangeValue | string | null | undefined,
  currency: BillingCurrency,
  fallback: string,
): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  const s = symbol(currency);

  if (!normalized) {
    return fallback;
  }

  const map: Record<AcvRangeValue, string> = {
    lt_10k: `<${s}10k`,
    "10k_50k": `${s}10k-${s}50k`,
    "50k_150k": `${s}50k-${s}150k`,
    "150k_500k": `${s}150k-${s}500k`,
    gte_500k: `${s}500k+`,
  };

  return map[normalized as AcvRangeValue] ?? fallback;
}

export function formatRevenueStageLabel(
  value: RevenueStageValue | string | null | undefined,
  currency: BillingCurrency,
  fallback: string,
): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  const s = symbol(currency);

  if (!normalized) {
    return fallback;
  }

  const map: Record<RevenueStageValue, string> = {
    pre: "Pre-revenue",
    lt_10k: `<${s}10k MRR`,
    "10k_50k": `${s}10k-${s}50k MRR`,
    gte_50k: `${s}50k+ MRR`,
  };

  return map[normalized as RevenueStageValue] ?? fallback;
}
