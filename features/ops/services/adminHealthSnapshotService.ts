import { collectQueueHealthSnapshot } from "@/features/ops/services/queueReliabilityService";
import { runDbContractStartupCheck } from "@/features/db/services/dbContractStartupService";
import { runReportCompletionStartupCheck } from "@/features/reports/services/reportCompletionContractService";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

type RagStatus = "green" | "amber" | "red";

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function toRag(value: number, amberThreshold: number, redThreshold: number): RagStatus {
  if (value >= redThreshold) {
    return "red";
  }
  if (value >= amberThreshold) {
    return "amber";
  }
  return "green";
}

export async function getAdminOpsSnapshot(): Promise<{
  providers: {
    openai: boolean;
    supabaseServiceRole: boolean;
    lemonsqueezyWebhook: boolean;
    rag: RagStatus;
  };
  queue: {
    depth: number;
    reportDepth: number;
    snapshotDepth: number;
    oldestQueuedAgeSeconds: number;
    averageProcessingDelaySeconds: number;
    failedLast24h: number;
    rag: RagStatus;
  };
  tokenAccounting: {
    pendingReconciliations: number;
    oldestPendingSeconds: number;
    rag: RagStatus;
  };
  reportContract: {
    reportCompletionRpc: boolean;
    dbContractSnapshot: boolean;
    rag: RagStatus;
  };
  scoringGovernance: {
    modelVersion: string | null;
    daysSinceCalibration: number;
    trainingSampleSize: number;
    driftThreshold: number;
    rag: RagStatus;
  };
}> {
  const [queueSnapshot, reportCompletionRpc, dbContractSnapshot] = await Promise.all([
    collectQueueHealthSnapshot(),
    runReportCompletionStartupCheck(),
    runDbContractStartupCheck(),
  ]);

  const admin = createSupabaseAdminClient("worker");
  const since24hIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: failedReportJobs },
    { count: failedSnapshotJobs },
    { count: pendingReconCount },
    pendingReconResult,
    scoringGovernanceResult,
  ] =
    await Promise.all([
      admin
        .from("report_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("updated_at", since24hIso),
      admin
        .from("free_snapshot_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("updated_at", since24hIso),
      admin
        .from("usage_finalization_reconciliation")
        .select("id", { count: "exact", head: true })
        .is("resolved_at", null),
      admin
        .from("usage_finalization_reconciliation")
        .select("created_at")
        .is("resolved_at", null)
        .order("created_at", { ascending: true })
        .limit(1),
      admin
        .from("scoring_model_versions")
        .select(
          "version, last_calibrated_at, training_sample_size, drift_threshold",
        )
        .order("last_calibrated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const pendingRows = (pendingReconResult.data ?? []) as Array<{ created_at: string }>;
  const oldestPendingMs =
    pendingRows.length > 0 ? new Date(pendingRows[0].created_at).getTime() : Number.NaN;
  const oldestPendingSeconds = Number.isFinite(oldestPendingMs)
    ? Math.max(0, Math.floor((Date.now() - oldestPendingMs) / 1000))
    : 0;

  const providers = {
    openai: hasValue(process.env.OPENAI_API_KEY),
    supabaseServiceRole: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    lemonsqueezyWebhook: hasValue(process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
  };
  const providersRag: RagStatus =
    providers.openai && providers.supabaseServiceRole && providers.lemonsqueezyWebhook
      ? "green"
      : "red";

  const failedLast24h = (failedReportJobs ?? 0) + (failedSnapshotJobs ?? 0);
  const queueRag = toRag(queueSnapshot.oldestQueuedAgeSeconds.overall, 180, 600);
  const tokenAccountingRag: RagStatus =
    oldestPendingSeconds >= 900 ? "red" : oldestPendingSeconds >= 300 ? "amber" : "green";
  const reportContractRag: RagStatus =
    reportCompletionRpc && dbContractSnapshot ? "green" : "red";
  const scoringRow = scoringGovernanceResult.data;
  const lastCalibratedMs =
    scoringRow && typeof scoringRow.last_calibrated_at === "string"
      ? new Date(scoringRow.last_calibrated_at).getTime()
      : Number.NaN;
  const daysSinceCalibration = Number.isFinite(lastCalibratedMs)
    ? Math.max(0, Math.floor((Date.now() - lastCalibratedMs) / (24 * 60 * 60 * 1000)))
    : 999;
  const scoringSampleSize =
    scoringRow && typeof scoringRow.training_sample_size === "number"
      ? scoringRow.training_sample_size
      : 0;
  const scoringDriftThreshold =
    scoringRow && typeof scoringRow.drift_threshold === "number"
      ? scoringRow.drift_threshold
      : 0;
  const scoringGovernanceRag: RagStatus =
    scoringSampleSize < 25 || daysSinceCalibration > 90
      ? "red"
      : scoringSampleSize < 100 || daysSinceCalibration > 45
        ? "amber"
        : "green";

  return {
    providers: {
      ...providers,
      rag: providersRag,
    },
    queue: {
      depth: queueSnapshot.queueSize.total,
      reportDepth: queueSnapshot.queueSize.report,
      snapshotDepth: queueSnapshot.queueSize.snapshot,
      oldestQueuedAgeSeconds: queueSnapshot.oldestQueuedAgeSeconds.overall,
      averageProcessingDelaySeconds: queueSnapshot.averageProcessingDelaySeconds.overall,
      failedLast24h,
      rag: queueRag,
    },
    tokenAccounting: {
      pendingReconciliations: pendingReconCount ?? 0,
      oldestPendingSeconds,
      rag: tokenAccountingRag,
    },
    reportContract: {
      reportCompletionRpc,
      dbContractSnapshot,
      rag: reportContractRag,
    },
    scoringGovernance: {
      modelVersion:
        scoringRow && typeof scoringRow.version === "string"
          ? scoringRow.version
          : null,
      daysSinceCalibration,
      trainingSampleSize: scoringSampleSize,
      driftThreshold: scoringDriftThreshold,
      rag: scoringGovernanceRag,
    },
  };
}
