import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";
import { sendWeeklyExecutiveSummary } from "@/features/settings/services/notificationService";

const USER_BATCH_SIZE = 250;
const SEND_CONCURRENCY = 20;

export type WeeklySummaryRunResult =
  | { ok: true; processed: number; sent: number; skipped: number }
  | { ok: false; error: string };

function formatWeeklySummary(completed: number): string {
  if (completed === 0) {
    return "No conversion gap reports were completed this week.";
  }

  return `Completed ${completed} conversion gap report${
    completed === 1 ? "" : "s"
  } this week.`;
}

type WeeklyCountRow = {
  user_id: string;
  completed_count: number;
};

async function fetchWeeklyCompletedCounts(params: {
  userIds: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<Map<string, number>> {
  const { userIds, windowStartIso, windowEndIso } = params;
  if (userIds.length === 0) {
    return new Map();
  }

  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin.rpc(
    "get_weekly_completed_report_counts",
    {
      p_user_ids: userIds,
      p_window_start: windowStartIso,
      p_window_end: windowEndIso,
    },
  );

  if (error) {
    logger.error("notifications.weekly_summary_count_batch_failed", error, {
      user_count: userIds.length,
    });
    return new Map();
  }

  const rows = (Array.isArray(data) ? data : []) as WeeklyCountRow[];
  return new Map(
    rows.map((row) => [row.user_id, Number(row.completed_count) || 0]),
  );
}

async function processBatch(params: {
  userIds: string[];
  windowStartIso: string;
  windowEndIso: string;
}): Promise<{ processed: number; sent: number; skipped: number }> {
  const { userIds, windowStartIso, windowEndIso } = params;
  const counts = await fetchWeeklyCompletedCounts({
    userIds,
    windowStartIso,
    windowEndIso,
  });

  let sent = 0;
  let skipped = 0;
  for (let index = 0; index < userIds.length; index += SEND_CONCURRENCY) {
    const chunk = userIds.slice(index, index + SEND_CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (userId) =>
        sendWeeklyExecutiveSummary({
          userId,
          summary: formatWeeklySummary(counts.get(userId) ?? 0),
          windowStart: windowStartIso,
          windowEnd: windowEndIso,
          skipSettingsCheck: true,
        }),
      ),
    );

    for (const result of results) {
      if (result.sent) {
        sent += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { processed: userIds.length, sent, skipped };
}

export async function runWeeklySummaryCron(): Promise<WeeklySummaryRunResult> {
  const admin = createSupabaseAdminClient("worker");
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowStartIso = windowStart.toISOString();
  const windowEndIso = windowEnd.toISOString();
  let processed = 0;
  let sent = 0;
  let skipped = 0;

  let from = 0;
  while (true) {
    const to = from + USER_BATCH_SIZE - 1;
    const { data, error } = await admin
      .from("user_settings")
      .select("user_id")
      .eq("weekly_exec_summary", true)
      .order("user_id", { ascending: true })
      .range(from, to);

    if (error) {
      logger.error("cron.weekly_summary_fetch_failed", error, { from, to });
      return { ok: false, error: "Unable to fetch users" };
    }

    const userIds = (data ?? []).map((row) => row.user_id as string);
    if (userIds.length === 0) {
      break;
    }

    const batchSummary = await processBatch({
      userIds,
      windowStartIso,
      windowEndIso,
    });
    processed += batchSummary.processed;
    sent += batchSummary.sent;
    skipped += batchSummary.skipped;

    if (userIds.length < USER_BATCH_SIZE) {
      break;
    }
    from += USER_BATCH_SIZE;
  }

  return { ok: true, processed, sent, skipped };
}

