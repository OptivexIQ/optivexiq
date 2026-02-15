import type { SettingsData } from "@/features/settings/types/settings.types";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { getUserSettings } from "@/features/settings/services/userSettingsService";

function formatSecurityNote(reviewDate: string | null) {
  if (!reviewDate) {
    return "Security review completed.";
  }

  const parsed = new Date(reviewDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Security review completed.";
  }

  return `Last review completed ${parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })}. SOC 2 evidence ready.`;
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
            status: "Security review completed",
            note: formatSecurityNote(userSettings.security_review_date),
          }
        : {
            status: "Security review pending",
            note: "Security review is pending.",
          },
      notifications: {
        title: "Notifications",
        description:
          "Keep revenue stakeholders aligned with your audit cadence.",
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
