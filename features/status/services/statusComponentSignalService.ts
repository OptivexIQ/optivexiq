import { createSupabaseAdminClient } from "@/services/supabase/admin";
import type {
  StatusComponent,
  SystemStatusLevel,
} from "@/features/status/types/status.types";

function sinceIso(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export async function getAnalysisComponent(updatedAt: string): Promise<StatusComponent> {
  const admin = createSupabaseAdminClient("worker");
  const windowIso = sinceIso(30);

  const [reportJobs, snapshotJobs] = await Promise.all([
    admin
      .from("report_jobs")
      .select("status")
      .in("status", ["queued", "processing", "failed"])
      .gte("updated_at", windowIso),
    admin
      .from("free_snapshot_jobs")
      .select("status")
      .in("status", ["queued", "processing", "failed"])
      .gte("updated_at", windowIso),
  ]);

  if (
    reportJobs.error ||
    snapshotJobs.error ||
    !Array.isArray(reportJobs.data) ||
    !Array.isArray(snapshotJobs.data)
  ) {
    return {
      key: "analysis",
      name: "Analysis Engine (Snapshot + Full Reports)",
      description: "Processes analysis requests and report generation.",
      status: "degraded",
      updatedAt,
      detail: "Signal collection is temporarily unavailable. We are investigating.",
    };
  }

  const combined = [...reportJobs.data, ...snapshotJobs.data] as Array<{ status: string }>;
  const pending = combined.filter(
    (job) => job.status === "queued" || job.status === "processing",
  ).length;
  const failed = combined.filter((job) => job.status === "failed").length;

  let status: SystemStatusLevel = "operational";
  let detail: string | undefined;

  if (failed >= 8) {
    status = "partial_outage";
    detail = "Some analyses are currently failing. The team is actively mitigating this.";
  } else if (failed >= 3 || pending >= 25) {
    status = "degraded";
    detail = "Analysis processing is slower than normal for some requests.";
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
