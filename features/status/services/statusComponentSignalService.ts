import { createSupabaseAdminClient } from "@/services/supabase/admin";
import type {
  StatusComponent,
  SystemStatusLevel,
} from "@/features/status/types/status.types";
import { collectQueueHealthSnapshot } from "@/features/ops/services/queueReliabilityService";

function sinceIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export async function getAnalysisComponent(updatedAt: string): Promise<StatusComponent> {
  const queueHealth = await collectQueueHealthSnapshot().catch(() => null);
  if (!queueHealth) {
    return {
      key: "analysis",
      name: "Analysis Engine (Snapshot + Full Reports)",
      description: "Processes analysis requests and report generation.",
      status: "degraded",
      updatedAt,
      detail: "Signal collection is temporarily unavailable. We are investigating.",
    };
  }

  let status: SystemStatusLevel = "operational";
  let detail: string | undefined;

  const workersHealthy =
    queueHealth.workerStatus.report.alive && queueHealth.workerStatus.snapshot.alive;
  const queueLagSevere = queueHealth.oldestQueuedAgeSeconds.overall >= 900;
  const queueLagDegraded = queueHealth.oldestQueuedAgeSeconds.overall >= 480;
  const failureSevere = queueHealth.failureRate.overall >= 0.4;
  const failureDegraded = queueHealth.failureRate.overall >= 0.25;

  if (!workersHealthy || queueLagSevere || failureSevere) {
    status = "partial_outage";
    detail =
      "Background analysis workers are experiencing reliability issues. Recovery is in progress.";
  } else if (queueLagDegraded || failureDegraded) {
    status = "degraded";
    detail =
      "Analysis processing reliability is degraded; some requests may complete slower than normal.";
  }

  return {
    key: "analysis",
    name: "Analysis Engine (Snapshot + Full Reports)",
    description: "Processes analysis requests and report generation.",
    status,
    updatedAt,
    detail,
  };
}

export async function getBillingComponent(updatedAt: string): Promise<StatusComponent> {
  const admin = createSupabaseAdminClient("worker");
  const staleCutoff = sinceIso(20);
  const dayWindow = sinceIso(24 * 60);

  const { data, error } = await admin
    .from("billing_checkout_sessions")
    .select("processed_at, created_at")
    .gte("created_at", dayWindow)
    .order("created_at", { ascending: false })
    .limit(150);

  if (error || !Array.isArray(data)) {
    return {
      key: "billing",
      name: "Billing & Account Services",
      description: "Handles checkout confirmation and account entitlement updates.",
      status: "degraded",
      updatedAt,
      detail: "Billing status signal is currently unavailable. We are investigating.",
    };
  }

  const stalePending = data.filter(
    (row) =>
      !row.processed_at &&
      typeof row.created_at === "string" &&
      row.created_at <= staleCutoff,
  ).length;

  let status: SystemStatusLevel = "operational";
  let detail: string | undefined;

  if (stalePending >= 12) {
    status = "partial_outage";
    detail = "Some billing confirmations are delayed for an extended period.";
  } else if (stalePending >= 5) {
    status = "degraded";
    detail = "Billing confirmations are slower than normal for some accounts.";
  }

  return {
    key: "billing",
    name: "Billing & Account Services",
    description: "Handles checkout confirmation and account entitlement updates.",
    status,
    updatedAt,
    detail,
  };
}
