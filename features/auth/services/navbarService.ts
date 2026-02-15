import { PLAN_LABELS } from "@/lib/constants/plans";
import { logger } from "@/lib/logger";
import {
  QUOTA_DANGER_THRESHOLD,
  QUOTA_WARNING_THRESHOLD,
} from "@/lib/constants/quotaThresholds";
import { getServerUser } from "@/lib/auth/getServerUser";
import { getUserProfile } from "@/features/auth/services/userProfileService";
import { getSubscription } from "@/features/billing/services/planValidationService";
import { getUsageSummary } from "@/features/usage/services/usageSummaryService";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { buildUserInitials } from "@/features/auth/utils/initials";
import type { UsageSummary } from "@/features/usage/services/usageSummaryService";

export type NavbarStatus = "active" | "inactive" | "past_due";
export type ProgressVariant = "normal" | "warning" | "danger";
export type StatusVariant = "secondary" | "chart-3" | "destructive";

export type NavbarData = {
  userInitials: string;
  workspaceName: string;
  planLabel: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  usageText: string;
  usagePercent: number | null;
  status: NavbarStatus;
  progressVariant: ProgressVariant;
};

type UsageMetric = {
  label: string;
  used: number;
  limit: number | null;
};

function normalizeCount(value: number | null | undefined) {
  return Number.isFinite(value ?? 0) ? Math.max(0, Math.floor(value ?? 0)) : 0;
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatUsageSegment(metric: UsageMetric) {
  if (metric.limit === null) {
    return `Unlimited ${metric.label}`;
  }

  return `${formatCount(metric.used)} / ${formatCount(metric.limit)} ${metric.label}`;
}

function resolvePrimaryMetric(summary: UsageSummary): UsageMetric {
  const reports = normalizeCount(summary.competitor_gaps_used);
  const reportLimit = summary.limits.max_reports;
  if (reportLimit !== null || reports > 0) {
    return {
      label: "reports",
      used: reports,
      limit: reportLimit,
    };
  }

  return {
    label: "tokens",
    used: normalizeCount(summary.tokens_used),
    limit: summary.limits.max_tokens,
  };
}

function buildUsageText(summary: UsageSummary): string {
  const primary = resolvePrimaryMetric(summary);
  return formatUsageSegment(primary);
}

function resolveUsagePercent(metric: UsageMetric | null) {
  if (!metric || metric.limit === null || metric.limit <= 0) {
    return null;
  }

  return Math.min(100, Math.round((metric.used / metric.limit) * 100));
}

function resolveProgressVariant(usagePercent: number | null): ProgressVariant {
  if (usagePercent === null) {
    return "normal";
  }

  if (usagePercent >= QUOTA_DANGER_THRESHOLD) {
    return "danger";
  }

  if (usagePercent >= QUOTA_WARNING_THRESHOLD) {
    return "warning";
  }

  return "normal";
}

function resolveStatus(summary: UsageSummary | null): NavbarStatus {
  if (!summary) {
    return "inactive";
  }

  if (summary.lifecycle.is_entitled) {
    return "active";
  }

  if (summary.lifecycle.state === "past_due") {
    return "past_due";
  }

  return "inactive";
}

function resolveStatusLabel(status: NavbarStatus) {
  if (status === "active") {
    return "Active";
  }

  if (status === "past_due") {
    return "Past due";
  }

  return "Inactive";
}

function resolveStatusVariant(status: NavbarStatus): StatusVariant {
  if (status === "active") {
    return "chart-3";
  }

  if (status === "past_due") {
    return "destructive";
  }

  return "secondary";
}

async function fetchNavbarData(): Promise<NavbarData> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Session unavailable");
  }
  const profile = await getUserProfile(user.id);
  const profileName = profile?.full_name ?? null;

  const settingsResult = await getUserSettings(user.id);
  const workspaceName = settingsResult.ok
    ? (settingsResult.settings.workspace_name ?? "")
    : "";
  const normalizedWorkspaceName = workspaceName.replace(/\s+Workspace$/i, "");

  const subscription = await getSubscription(user.id);
  if (!subscription) {
    throw new Error("Subscription unavailable");
  }

  const usageSummaryResult = await getUsageSummary(user.id, subscription);
  if (!usageSummaryResult.ok) {
    throw new Error(usageSummaryResult.error);
  }
  const usageSummary = usageSummaryResult.data;

  const primaryMetric = resolvePrimaryMetric(usageSummary);
  const usagePercent = resolveUsagePercent(primaryMetric);
  const progressVariant = resolveProgressVariant(usagePercent);
  const usageText = buildUsageText(usageSummary);
  const status = resolveStatus(usageSummary);

  return {
    userInitials: buildUserInitials(profileName ?? user.email),
    workspaceName: normalizedWorkspaceName,
    planLabel: PLAN_LABELS[subscription.plan] ?? subscription.plan,
    statusLabel: resolveStatusLabel(status),
    statusVariant: resolveStatusVariant(status),
    usageText,
    usagePercent,
    status,
    progressVariant,
  };
}

export async function getNavbarData(): Promise<NavbarData> {
  try {
    return await fetchNavbarData();
  } catch (error) {
    logger.error("Failed to build dashboard navbar data.", error);
    throw error;
  }
}

export async function getNavbarDataSafe(): Promise<NavbarData | null> {
  try {
    return await getNavbarData();
  } catch (error) {
    logger.warn("Navbar data unavailable; rendering fallback.", { error });
    return null;
  }
}
