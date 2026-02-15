import { insertRow } from "@/lib/db/dbHelpers";
import { logger } from "@/lib/logger";
import type { UsageEvent } from "@/features/usage/types/usage.types";

type UsageEventInput = Omit<UsageEvent, "created_at"> & {
  created_at?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function logUsageEvent(event: UsageEventInput) {
  const payload: UsageEvent = {
    ...event,
    created_at: event.created_at ?? nowIso(),
  };

  const result = await insertRow("usage_events", payload);
  if (!result.ok) {
    logger.warn("Failed to log usage event.", {
      user_id: event.user_id,
      action: event.action,
      error: result.error,
    });
  }

  return result.ok;
}
