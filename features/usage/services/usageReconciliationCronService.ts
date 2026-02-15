import { logger } from "@/lib/logger";
import { reconcilePendingUsageFinalizations } from "@/features/usage/services/usageFinalizationReconciliationService";
import { sweepStaleUsageReservations } from "@/features/usage/services/usageReservationSweeperService";

export async function runUsageReconciliationCron(): Promise<
  | {
      ok: true;
      reconciliation: { processed: number; resolved: number; failed: number };
      sweeper: { scanned: number; resolved: number; skipped: number };
    }
  | { ok: false; error: string }
> {
  try {
    const [reconciliation, sweeper] = await Promise.all([
      reconcilePendingUsageFinalizations(),
      sweepStaleUsageReservations(),
    ]);

    return {
      ok: true,
      reconciliation,
      sweeper,
    };
  } catch (error) {
    logger.error("Usage reconciliation cron failed.", error);
    return { ok: false, error: "usage_reconciliation_cron_failed" };
  }
}

