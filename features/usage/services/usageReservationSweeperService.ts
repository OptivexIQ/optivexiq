import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import { emitOperationalAlert } from "@/lib/ops/criticalAlertService";
import { rollbackGapReportQuotaReservation } from "./usageTracker";

type ReservationRow = {
  reservation_key: string;
  user_id: string;
  usage_kind: "generate" | "gap_report" | "snapshot";
  report_id: string | null;
  created_at: string;
};

type ReportRow = {
  status: string | null;
  quota_charged: boolean | null;
};

const STALE_MINUTES = 45;
const CRITICAL_STALE_MINUTES = 120;

function staleBeforeIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

async function reconcileGapReservation(row: ReservationRow): Promise<"resolved" | "skipped"> {
  if (!row.report_id) {
    await rollbackGapReportQuotaReservation({
      userId: row.user_id,
      reservationKey: row.reservation_key,
    });
    return "resolved";
  }

  const admin = createSupabaseAdminClient("worker");
  const { data } = await admin
    .from("conversion_gap_reports")
    .select("status, quota_charged")
    .eq("id", row.report_id)
    .maybeSingle();
  const report = (data ?? null) as ReportRow | null;

  if (!report) {
    await rollbackGapReportQuotaReservation({
      userId: row.user_id,
      reservationKey: row.reservation_key,
    });
    return "resolved";
  }

  if (report.status === "failed") {
    await rollbackGapReportQuotaReservation({
      userId: row.user_id,
      reservationKey: row.reservation_key,
    });
    return "resolved";
  }

  if (report.status === "completed" && report.quota_charged) {
    await admin
      .from("usage_reservations")
      .update({ status: "committed", updated_at: new Date().toISOString() })
      .eq("reservation_key", row.reservation_key)
      .eq("status", "reserved");
    return "resolved";
  }

  const createdAt = new Date(row.created_at).getTime();
  if (
    Number.isFinite(createdAt) &&
    Date.now() - createdAt > CRITICAL_STALE_MINUTES * 60 * 1000
  ) {
    await emitOperationalAlert({
      severity: "high",
      source: "usage_reservation_sweeper",
      message: "Gap report reservation stuck in running/queued state.",
      context: {
        reservation_key: row.reservation_key,
        user_id: row.user_id,
        report_id: row.report_id,
        report_status: report.status,
      },
    });
  }

  return "skipped";
}

async function reconcileGenerateReservation(
  row: ReservationRow,
): Promise<"resolved" | "skipped"> {
  logger.error("Generate reservation remains unfinalized after stale window.", {
    reservation_key: row.reservation_key,
    user_id: row.user_id,
  });
  await emitOperationalAlert({
    severity: "critical",
    source: "usage_reservation_sweeper",
    message: "Generate reservation stale and still reserved; manual intervention required.",
    context: {
      reservation_key: row.reservation_key,
      user_id: row.user_id,
      usage_kind: row.usage_kind,
    },
  });
  return "skipped";
}

export async function sweepStaleUsageReservations(limit = 200): Promise<{
  scanned: number;
  resolved: number;
  skipped: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("usage_reservations")
    .select("reservation_key, user_id, usage_kind, report_id, created_at")
    .eq("status", "reserved")
    .lte("created_at", staleBeforeIso(STALE_MINUTES))
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    logger.error("Failed to query stale usage reservations.", error);
    return { scanned: 0, resolved: 0, skipped: 0 };
  }

  const rows = (data ?? []) as ReservationRow[];
  let resolved = 0;
  let skipped = 0;

  for (const row of rows) {
    const result =
      row.usage_kind === "gap_report"
        ? await reconcileGapReservation(row)
        : row.usage_kind === "generate"
          ? await reconcileGenerateReservation(row)
          : "skipped";

    if (result === "resolved") {
      resolved += 1;
    } else {
      skipped += 1;
    }
  }

  return { scanned: rows.length, resolved, skipped };
}

