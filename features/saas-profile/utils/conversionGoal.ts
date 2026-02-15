const CONVERSION_GOAL_LABELS: Record<string, string> = {
  demo: "Get more demos",
  trial: "Get more free trials",
  paid: "Convert to paid",
  educate: "Educate before sales",
};

export function formatConversionGoalLabel(
  value: string | null | undefined,
  fallback: string,
): string {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return fallback;
  }

  const mapped = CONVERSION_GOAL_LABELS[normalized];
  if (mapped) {
    return mapped;
  }

  const existingLabel = Object.values(CONVERSION_GOAL_LABELS).find(
    (label) => label.toLowerCase() === normalized,
  );
  return existingLabel ?? fallback;
}
