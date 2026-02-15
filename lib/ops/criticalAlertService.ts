import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

type AlertSeverity = "critical" | "high" | "warning";

export async function emitOperationalAlert(input: {
  severity: AlertSeverity;
  source: string;
  message: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  logger.error(`ALERT ${input.severity.toUpperCase()}: ${input.message}`, undefined, {
    source: input.source,
    ...input.context,
  });

  try {
    const admin = createSupabaseAdminClient("worker");
    await admin.from("operational_alerts").insert({
      severity: input.severity,
      source: input.source,
      message: input.message,
      context: input.context ?? {},
    });
  } catch (error) {
    logger.error("Failed to persist operational alert.", error, {
      source: input.source,
      severity: input.severity,
    });
  }
}
