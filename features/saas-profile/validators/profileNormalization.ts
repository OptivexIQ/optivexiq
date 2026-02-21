import type {
  AcvRangeValue,
  ConversionGoalValue,
  RevenueStageValue,
} from "@/features/saas-profile/constants/profileEnums";

function normalizeTextBase(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/Ã¢â€šÂ¬/g, "EUR")
    .replace(/â‚¬/g, "EUR")
    .replace(/[â€“â€”]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function compactForEnum(value: string): string {
  return normalizeTextBase(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/mrr/g, "")
    .replace(/annualrecurringrevenue/g, "")
    .replace(/arr/g, "")
    .replace(/€/g, "eur")
    .replace(/â‚¬/g, "eur")
    .replace(/£/g, "gbp")
    .replace(/\$/g, "usd");
}

export function sanitizeProfileText(value: string): string {
  return normalizeTextBase(value);
}

export function normalizeAcvRangeValue(value: unknown): AcvRangeValue | null {
  if (typeof value !== "string") {
    return null;
  }

  const compact = compactForEnum(value);

  if (
    compact === "lt_10k" ||
    compact === "<eur10k" ||
    compact === "<usd10k" ||
    compact === "<gbp10k" ||
    compact === "<10k" ||
    compact === "under10k" ||
    compact === "undereur10k" ||
    compact === "underusd10k" ||
    compact === "undergbp10k"
  ) {
    return "lt_10k";
  }
  if (
    compact === "10k_50k" ||
    compact === "eur10k-50k" ||
    compact === "usd10k-50k" ||
    compact === "gbp10k-50k" ||
    compact === "10k-50k" ||
    compact === "eur10kto50k" ||
    compact === "usd10kto50k" ||
    compact === "gbp10kto50k"
  ) {
    return "10k_50k";
  }
  if (
    compact === "50k_150k" ||
    compact === "eur50k-150k" ||
    compact === "usd50k-150k" ||
    compact === "gbp50k-150k" ||
    compact === "50k-150k" ||
    compact === "eur50kto150k" ||
    compact === "usd50kto150k" ||
    compact === "gbp50kto150k"
  ) {
    return "50k_150k";
  }
  if (
    compact === "150k_500k" ||
    compact === "eur150k-500k" ||
    compact === "usd150k-500k" ||
    compact === "gbp150k-500k" ||
    compact === "150k-500k" ||
    compact === "eur150kto500k" ||
    compact === "usd150kto500k" ||
    compact === "gbp150kto500k"
  ) {
    return "150k_500k";
  }
  if (
    compact === "gte_500k" ||
    compact === "eur500k+" ||
    compact === "usd500k+" ||
    compact === "gbp500k+" ||
    compact === "500k+" ||
    compact === "over500k" ||
    compact === ">=500k"
  ) {
    return "gte_500k";
  }

  return null;
}

export function normalizeRevenueStageValue(
  value: unknown,
): RevenueStageValue | null {
  if (typeof value !== "string") {
    return null;
  }

  const compact = compactForEnum(value);

  if (
    compact === "pre" ||
    compact === "prerevenue" ||
    compact === "pre-revenue"
  ) {
    return "pre";
  }
  if (
    compact === "lt_10k" ||
    compact === "<eur10k" ||
    compact === "<usd10k" ||
    compact === "<gbp10k" ||
    compact === "<10k" ||
    compact === "under10k" ||
    compact === "undereur10k" ||
    compact === "underusd10k" ||
    compact === "undergbp10k"
  ) {
    return "lt_10k";
  }
  if (
    compact === "10k_50k" ||
    compact === "eur10k-50k" ||
    compact === "usd10k-50k" ||
    compact === "gbp10k-50k" ||
    compact === "10k-50k" ||
    compact === "eur10kto50k" ||
    compact === "usd10kto50k" ||
    compact === "gbp10kto50k"
  ) {
    return "10k_50k";
  }
  if (
    compact === "gte_50k" ||
    compact === "eur50k+" ||
    compact === "usd50k+" ||
    compact === "gbp50k+" ||
    compact === "50k+" ||
    compact === "over50k" ||
    compact === ">=50k"
  ) {
    return "gte_50k";
  }

  return null;
}

export function normalizeConversionGoalValue(
  value: unknown,
): ConversionGoalValue | null {
  if (typeof value !== "string") {
    return null;
  }

  const compact = compactForEnum(value);

  if (compact === "demo" || compact === "demos" || compact === "bookdemo") {
    return "demo";
  }
  if (
    compact === "trial" ||
    compact === "trials" ||
    compact === "freetrial" ||
    compact === "free-trial"
  ) {
    return "trial";
  }
  if (compact === "paid" || compact === "converttopaid") {
    return "paid";
  }
  if (
    compact === "educate" ||
    compact === "education" ||
    compact === "educatebeforesales"
  ) {
    return "educate";
  }

  return null;
}
