import { randomInt } from "crypto";

export type FeedbackRequestPrefix = "FR" | "BR";

/**
 * Generates a trackable request ID:
 * FR-<timestamp>-<3 digit suffix> or BR-<timestamp>-<3 digit suffix>
 * Example: FR-1719601234567-042
 */
export function generateRequestId(prefix: FeedbackRequestPrefix): string {
  const timestamp = Date.now();
  const randomSuffix = randomInt(0, 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${randomSuffix}`;
}
