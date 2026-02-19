import type { SettingsData } from "@/features/settings/types/settings.types";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { getUserSettings } from "@/features/settings/services/userSettingsService";

function formatSecurityNote(reviewDate: string | null) {
  if (!reviewDate) {
    return "Baseline controls active.";
  }

  const parsed = new Date(reviewDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Baseline controls active.";
  }

  return `Security posture refreshed ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })}.`;
}

async function fetchSettingsData(): Promise<SettingsData> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      throw new Error("Unauthorized");
    }

    const settingsResult = await getUserSettings(authData.user.id);
    if (!settingsResult.ok) {
      throw new Error(settingsResult.error);
    }

    const userSettings = settingsResult.settings;

    const workspaceName = userSettings.workspace_name ?? "";
    const primaryContact = userSettings.primary_contact ?? "";
    const region = userSettings.region ?? "";

    const retentionDays = Math.max(1, userSettings.report_retention_days);
    const exportRestricted = userSettings.export_restricted;

    const notificationItems = [
      userSettings.weekly_exec_summary ? "Weekly executive summary" : null,
      userSettings.completion_alerts ? "Report completion alerts" : null,
      userSettings.overlap_warnings ? "Competitor overlap warnings" : null,
      "Billing and usage thresholds",
    ].filter((item): item is string => Boolean(item));

    const sections = [
      {
        title: "Account",
        description: "Identity and workspace defaults for OptivexIQ.",
        items: [
          { label: "Workspace name", value: workspaceName },
          { label: "Primary contact", value: primaryContact },
          { label: "Region", value: region },
        ],
      },
      {
        title: "Data & privacy",
        description:
          "Control data retention and how your audits are stored and shared.",
        items: [
          {
            label: "Report retention",
            value: `${retentionDays} days`,
            helper: `Stored reports are auto-archived after ${retentionDays} days.`,
          },
          {
            label: "Workspace access",
            value: exportRestricted ? "Restricted" : "Open",
            helper: exportRestricted
              ? "Only admins can export reports."
              : "Exports are available to workspace members.",
          },
        ],
      },
    ];

    return {
      headline: "Settings",
      sections,
      security: userSettings.security_review_completed
        ? {
            status: "Baseline controls active",
            note: formatSecurityNote(userSettings.security_review_date),
          }
        : {
            status: "Security posture in progress",
            note: "Security controls are being improved continuously.",
          },
      notifications: {
        title: "Notifications",
        description:
          "Keep revenue stakeholders aligned with your reporting cadence.",
        items: notificationItems,
      },
    };
  } catch (error) {
    logger.error("Failed to build settings data.", error);
    throw error;
  }
}

export async function getSettingsData(): Promise<SettingsData> {
  return fetchSettingsData();
}
