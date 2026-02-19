import { logger } from "@/lib/logger";
import type {
  ComponentKey,
  StatusIncident,
  SystemStatusLevel,
} from "@/features/status/types/status.types";

export type AlertRow = {
  id: number;
  severity: "critical" | "high" | "warning";
  source: string;
  created_at: string;
};

const INCIDENT_WINDOW_DAYS = 30;

function levelFromAlertSeverity(severity: AlertRow["severity"]): SystemStatusLevel {
  if (severity === "critical") {
    return "partial_outage";
  }
  return "degraded";
}

export function inferAlertComponent(source: string): ComponentKey {
  const normalized = source.toLowerCase();
  if (normalized.includes("billing") || normalized.includes("checkout") || normalized.includes("webhook")) {
    return "billing";
  }
  if (normalized.includes("email") || normalized.includes("notification")) {
    return "email";
  }
  if (
    normalized.includes("report") ||
    normalized.includes("snapshot") ||
    normalized.includes("analysis") ||
    normalized.includes("gap")
  ) {
    return "analysis";
  }
  return "web";
}

export function buildIncidentFromAlert(alert: AlertRow): StatusIncident {
  const level = levelFromAlertSeverity(alert.severity);
  const title =
    level === "partial_outage"
      ? "Service disruption was detected"
      : "Service performance issue was detected";

  return {
    id: `ops-${alert.id}`,
    title,
    status: "resolved",
    startedAt: alert.created_at,
    resolvedAt: alert.created_at,
    customerImpact:
      "Some users may have experienced delayed or interrupted service during this period.",
    updates: [
      {
        at: alert.created_at,
        message: "Issue identified and mitigated.",
      },
    ],
  };
}

export async function fetchRecentAlerts(): Promise<AlertRow[] | null> {
  const { createSupabaseAdminClient } = await import("@/services/supabase/admin");
  const admin = createSupabaseAdminClient("worker");
  const since = new Date(
    Date.now() - INCIDENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await admin
    .from("operational_alerts")
    .select("id, severity, source, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !Array.isArray(data)) {
    logger.error("status.alerts_fetch_failed", error);
    return null;
  }

  return data as AlertRow[];
}

export function levelFromAlert(alert: AlertRow): SystemStatusLevel {
  return levelFromAlertSeverity(alert.severity);
}
