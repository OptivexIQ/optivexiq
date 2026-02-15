export const MARKET_REGIONS = [
  "United States",
  "Europe (EU)",
  "United Kingdom",
  "Canada",
  "Australia / New Zealand",
  "Asia-Pacific",
  "Middle East",
  "Global",
] as const;

export type MarketRegion = (typeof MARKET_REGIONS)[number];