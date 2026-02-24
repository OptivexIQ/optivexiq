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
  message: string;
  context: unknown;
  created_at: string;
};

const INCIDENT_WINDOW_DAYS = 30;

function levelFromAlertSeverity(severity: AlertRow["severity"]): SystemStatusLevel {
  if (severity === "critical") {
    return "partial_outage";
  }
  return "degraded";
}

function normalizeSource(source: string): string {
  return source.trim().toLowerCase();
}

export function inferAlertComponent(source: string): ComponentKey {
  const normalized = normalizeSource(source);
  if (
    normalized.startsWith("queue.") ||
    normalized.includes("worker") ||
    normalized.includes("report_job") ||
    normalized.includes("snapshot_job")
  ) {
    return "analysis";
  }
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

function inferIncidentKey(alert: AlertRow): string {
  const source = normalizeSource(alert.source);
  if (source === "queue.processing_delay") {
    return "analysis_processing_delay";
  }
  if (source === "queue.lag") {
    return "analysis_queue_lag";
  }
  if (source === "queue.failure_rate") {
    return "analysis_failure_rate";
  }
  if (source === "queue.worker.report") {
    return "analysis_worker_report";
  }
  if (source === "queue.worker.snapshot") {
    return "analysis_worker_snapshot";
  }
  return `${inferAlertComponent(source)}:${source}`;
}

function humanizeUpdate(alert: AlertRow): string {
  const source = normalizeSource(alert.source);
  const context =
    alert.context && typeof alert.context === "object" && !Array.isArray(alert.context)
      ? (alert.context as Record<string, unknown>)
      : null;
  const resolvedAt = context?.resolved_at;
  if (typeof resolvedAt === "string" && resolvedAt.trim().length > 0) {
    if (source === "queue.processing_delay") {
      return "Analysis processing delays recovered and returned to expected range.";
    }
    if (source === "queue.lag") {
      return "Analysis queue backlog recovered to expected range.";
    }
    if (source === "queue.failure_rate") {
      return "Analysis failure rate recovered to expected range.";
    }
    if (source === "queue.worker.report" || source === "queue.worker.snapshot") {
      return "Background analysis worker health recovered.";
    }
    return "Service recovered and is operating normally.";
  }

  if (source === "queue.processing_delay") {
    return "Analysis processing delays are elevated; we are mitigating queue pressure.";
  }
  if (source === "queue.lag") {
    return "Queue backlog increased and may delay some report completions.";
  }
  if (source === "queue.failure_rate") {
    return "Analysis job failure rate increased; retry and recovery routines are active.";
  }
  if (source === "queue.worker.report" || source === "queue.worker.snapshot") {
    return "A background analysis worker became unhealthy and recovery is in progress.";
  }
  const text = alert.message.trim();
  return text.length > 0
    ? text
    : "Issue identified and mitigation is in progress.";
}

function buildIncidentTitle(key: string, component: ComponentKey): string {
  if (key === "analysis_processing_delay") {
    return "Analysis processing delays";
  }
  if (key === "analysis_queue_lag") {
    return "Analysis queue backlog";
  }
  if (key === "analysis_failure_rate") {
    return "Analysis reliability degradation";
  }
  if (key === "analysis_worker_report" || key === "analysis_worker_snapshot") {
    return "Analysis worker disruption";
  }
  if (component === "billing") {
    return "Billing processing issue";
  }
  if (component === "email") {
    return "Email delivery delays";
  }
  if (component === "analysis") {
    return "Analysis service issue";
  }
  return "Website performance issue";
}

function buildCustomerImpact(key: string, component: ComponentKey): string {
  if (key === "analysis_processing_delay" || key === "analysis_queue_lag") {
    return "Some snapshot and full report requests may complete slower than expected.";
  }
  if (key === "analysis_failure_rate") {
    return "Some analysis jobs may fail and require automatic retry before completion.";
  }
  if (key === "analysis_worker_report" || key === "analysis_worker_snapshot") {
    return "Some analysis requests may be delayed while worker recovery is in progress.";
  }
  if (component === "billing") {
    return "Some billing confirmations may be delayed for a subset of accounts.";
  }
  if (component === "email") {
    return "Some outgoing emails may be delayed.";
  }
  if (component === "analysis") {
    return "Some analysis workflows may be slower or intermittently unavailable.";
  }
  return "Some users may experience temporary website or dashboard performance issues.";
}

function resolveIncidentStatus(alert: AlertRow): StatusIncident["status"] {
  const context =
    alert.context && typeof alert.context === "object" && !Array.isArray(alert.context)
      ? (alert.context as Record<string, unknown>)
      : null;
  const resolvedAt = context?.resolved_at;
  if (typeof resolvedAt === "string" && resolvedAt.trim().length > 0) {
    return "resolved";
  }

  const ageMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 60_000),
  );
  if (ageMinutes < 15) {
    return "investigating";
  }
  if (ageMinutes < 60) {
    return "identified";
  }
  if (ageMinutes < 180) {
    return "monitoring";
  }
  return "monitoring";
}

export function buildIncidentFromAlert(alert: AlertRow): StatusIncident {
  const level = levelFromAlertSeverity(alert.severity);
  const incidentStatus = resolveIncidentStatus(alert);
  const context =
    alert.context && typeof alert.context === "object" && !Array.isArray(alert.context)
      ? (alert.context as Record<string, unknown>)
      : null;
  const resolvedAtRaw = context?.resolved_at;
  const resolvedAt =
    typeof resolvedAtRaw === "string" && resolvedAtRaw.trim().length > 0
      ? resolvedAtRaw
      : incidentStatus === "resolved"
        ? alert.created_at
        : undefined;
  const title =
    level === "partial_outage"
      ? "Service disruption was detected"
      : "Service performance issue was detected";

  return {
    id: `ops-${alert.id}`,
    title,
    status: incidentStatus,
    startedAt: alert.created_at,
    resolvedAt,
    customerImpact:
      "Some users may have experienced delayed or interrupted service during this period.",
    updates: [
      {
        at: alert.created_at,
        message:
          alert.message.trim().length > 0
            ? alert.message
            : "Issue identified and mitigation in progress.",
      },
    ],
  };
}

export function buildIncidentsFromAlerts(alerts: AlertRow[]): StatusIncident[] {
  if (alerts.length === 0) {
    return [];
  }

  const groups = new Map<string, AlertRow[]>();
  for (const alert of alerts) {
    const key = inferIncidentKey(alert);
    const existing = groups.get(key) ?? [];
    existing.push(alert);
    groups.set(key, existing);
  }

  const incidents: Array<{ incident: StatusIncident; lastAt: number }> = [];
  for (const [key, rows] of groups.entries()) {
    const sorted = [...rows].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const component = inferAlertComponent(latest.source);
    const context =
      latest.context &&
      typeof latest.context === "object" &&
      !Array.isArray(latest.context)
        ? (latest.context as Record<string, unknown>)
        : null;
    const resolvedAtRaw = context?.resolved_at;
    const status = resolveIncidentStatus(latest);

    const dedupedUpdates = sorted
      .map((alert) => ({
        at: alert.created_at,
        message: humanizeUpdate(alert),
      }))
      .filter(
        (item, index, array) =>
          array.findIndex(
            (candidate) =>
              candidate.at === item.at && candidate.message === item.message,
          ) === index,
      )
      .slice(-8);

    incidents.push({
      incident: {
        id: `ops-${key}`,
        title: buildIncidentTitle(key, component),
        status,
        startedAt: first.created_at,
        resolvedAt:
          typeof resolvedAtRaw === "string" && resolvedAtRaw.trim().length > 0
            ? resolvedAtRaw
            : undefined,
        customerImpact: buildCustomerImpact(key, component),
        updates: dedupedUpdates,
      },
      lastAt: new Date(latest.created_at).getTime(),
    });
  }

  return incidents
    .sort((a, b) => b.lastAt - a.lastAt)
    .map((item) => item.incident);
}

export async function fetchRecentAlerts(): Promise<AlertRow[] | null> {
  const { createSupabaseAdminClient } = await import("@/services/supabase/admin");
  const admin = createSupabaseAdminClient("worker");
  const since = new Date(
    Date.now() - INCIDENT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data, error } = await admin
    .from("operational_alerts")
    .select("id, severity, source, message, context, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !Array.isArray(data)) {
    logger.error("status.alerts_fetch_failed", error);
    return null;
  }

  return data.map((item) => ({
    id: Number(item.id),
    severity:
      item.severity === "critical" || item.severity === "high"
        ? item.severity
        : "warning",
    source: typeof item.source === "string" ? item.source : "unknown",
    message: typeof item.message === "string" ? item.message : "",
    context: item.context ?? null,
    created_at: typeof item.created_at === "string" ? item.created_at : new Date().toISOString(),
  })) as AlertRow[];
}

export function levelFromAlert(alert: AlertRow): SystemStatusLevel {
  return levelFromAlertSeverity(alert.severity);
}
