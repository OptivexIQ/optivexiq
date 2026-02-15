const REVENUE_STAGE_LABELS: Record<string, string> = {
  pre: "Pre-revenue",
  "<â‚¬10k": "<â‚¬10k MRR",
  "â‚¬10k-50k": "â‚¬10kâ€“â‚¬50k MRR",
  "â‚¬50k+": "â‚¬50k+ MRR",
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
