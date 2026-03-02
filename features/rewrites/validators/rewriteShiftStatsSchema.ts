import { z } from "zod";

const SHIFT_PERCENT_PATTERN = /^[+-]\d{1,3}(?:\.\d+)?%$/;

const shiftPercentSchema = z
  .string()
  .trim()
  .regex(
    SHIFT_PERCENT_PATTERN,
    "Shift values must be signed percentages such as +42% or -18%.",
  )
  .refine((value) => {
    const numeric = Number(value.replace("%", ""));
    return Number.isFinite(numeric) && Math.abs(numeric) <= 100;
  }, "Shift percentage must be between -100% and +100%.");

const positioningShiftSchema = z.enum([
  "Strong",
  "Moderate",
  "Weak",
  "Improving",
  "Needs Work",
]);

export const rewriteShiftStatsSchema = z.object({
  clarityShift: shiftPercentSchema,
  objectionShift: shiftPercentSchema,
  positioningShift: positioningShiftSchema,
});

export type RewriteShiftStats = z.infer<typeof rewriteShiftStatsSchema>;

function extractLabeledLine(text: string, label: string): string | null {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*:\\s*(.+)$`,
      "gim",
    ),
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*-\\s*(.+)$`,
      "gim",
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value.length > 0) {
        return value;
      }
    }
  }

  return null;
}

function normalizePositioningShift(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim().toLowerCase();
  if (compact === "strong") return "Strong";
  if (compact === "moderate") return "Moderate";
  if (compact === "weak") return "Weak";
  if (compact === "improving") return "Improving";
  if (compact === "needs work") return "Needs Work";
  return value.trim();
}

export function parseRewriteShiftStatsFromText(
  text: string,
): RewriteShiftStats | null {
  const clarityShift = extractLabeledLine(text, "Clarity Shift");
  const objectionShift = extractLabeledLine(text, "Objection Shift");
  const positioningRaw = extractLabeledLine(text, "Positioning Shift");

  if (!clarityShift || !objectionShift || !positioningRaw) {
    return null;
  }

  const parsed = rewriteShiftStatsSchema.safeParse({
    clarityShift,
    objectionShift,
    positioningShift: normalizePositioningShift(positioningRaw),
  });

  return parsed.success ? parsed.data : null;
}

export function formatRewriteShiftStatsBlock(stats: RewriteShiftStats): string {
  return [
    "### Shift Metrics",
    `- Clarity Shift: ${stats.clarityShift}`,
    `- Objection Shift: ${stats.objectionShift}`,
    `- Positioning Shift: ${stats.positioningShift}`,
    "",
  ].join("\n");
}
