const REVENUE_STAGE_LABELS: Record<string, string> = {
  pre: "Pre-revenue",
  "<€10k": "<€10k MRR",
  "€10k-50k": "€10k-€50k MRR",
  "€50k+": "€50k+ MRR",
};

export function formatRevenueStageLabel(
  value: string | null | undefined,
  fallback: string,
): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return fallback;
  }

  const mapped = REVENUE_STAGE_LABELS[normalized];
  if (mapped) {
    return mapped;
  }

  const existingLabel = Object.values(REVENUE_STAGE_LABELS).find(
    (label) => label.toLowerCase() === normalized,
  );
  return existingLabel ?? fallback;
}
