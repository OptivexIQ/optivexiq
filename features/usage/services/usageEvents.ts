import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import type { UsageEvent } from "@/features/usage/types/usage.types";

type UsageEventInput = Omit<UsageEvent, "created_at"> & {
  created_at?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function logUsageEvent(event: UsageEventInput) {
  // Security invariant:
  // Usage events are written from trusted background processing paths.
  const supabase = createSupabaseAdminClient("worker");
  const payload: UsageEvent = {
    ...event,
    created_at: event.created_at ?? nowIso(),
  };

  const { error } = await supabase.from("usage_events").insert(payload);
  if (error) {
    logger.warn("Failed to log usage event.", {
      user_id: event.user_id,
      action: event.action,
      error: error.message,
    });
    return false;
  }

  return true;
}
