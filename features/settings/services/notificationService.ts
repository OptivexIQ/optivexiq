import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { logger } from "@/lib/logger";

type NotificationResult = {
  sent: boolean;
  reason?: string;
};

async function canSend(
  userId: string,
  flag: keyof ReturnType<typeof mapFlags>,
) {
  const settingsResult = await getUserSettings(userId);
  if (!settingsResult.ok) {
    logger.warn("notifications.settings_unavailable", {
      user_id: userId,
      error: settingsResult.error,
    });
    return { allowed: false, reason: "settings_unavailable" };
  }

  const flags = mapFlags(settingsResult.settings);
  if (!flags[flag]) {
    return { allowed: false, reason: "disabled" };
  }

  return { allowed: true };
}

function mapFlags(settings: {
  weekly_exec_summary: boolean;
  completion_alerts: boolean;
  overlap_warnings: boolean;
}) {
  return {
    weekly_exec_summary: settings.weekly_exec_summary,
    completion_alerts: settings.completion_alerts,
    overlap_warnings: settings.overlap_warnings,
  };
}

export async function sendWeeklyExecutiveSummary(params: {
  userId: string;
  summary: string;
  windowStart: string;
  windowEnd: string;
  skipSettingsCheck?: boolean;
}): Promise<NotificationResult> {
  if (!params.skipSettingsCheck) {
    const { allowed, reason } = await canSend(
      params.userId,
      "weekly_exec_summary",
    );
    if (!allowed) {
      logger.info("notifications.weekly_summary_skipped", {
        user_id: params.userId,
        reason,
      });
      return { sent: false, reason };
    }
  }

  logger.info("notifications.weekly_summary_ready", {
    user_id: params.userId,
    window_start: params.windowStart,
    window_end: params.windowEnd,
  });

  return { sent: true };
}

export async function sendReportCompletionAlert(params: {
  userId: string;
  reportId: string;
}): Promise<NotificationResult> {
  const { allowed, reason } = await canSend(params.userId, "completion_alerts");
  if (!allowed) {
    logger.info("notifications.report_completion_skipped", {
      user_id: params.userId,
      report_id: params.reportId,
      reason,
    });
    return { sent: false, reason };
  }

  logger.info("notifications.report_completion_ready", {
    user_id: params.userId,
    report_id: params.reportId,
  });

  return { sent: true };
}

export async function sendOverlapWarning(params: {
  userId: string;
  reportId: string;
  overlapCount: number;
}): Promise<NotificationResult> {
  if (params.overlapCount <= 0) {
    return { sent: false, reason: "no_overlap" };
  }

  const { allowed, reason } = await canSend(params.userId, "overlap_warnings");
  if (!allowed) {
    logger.info("notifications.overlap_warning_skipped", {
      user_id: params.userId,
      report_id: params.reportId,
      reason,
    });
    return { sent: false, reason };
  }

  logger.info("notifications.overlap_warning_ready", {
    user_id: params.userId,
    report_id: params.reportId,
    overlap_count: params.overlapCount,
  });

  return { sent: true };
}
