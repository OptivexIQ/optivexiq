import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { processQueuedReportJob } from "@/features/reports/services/reportCreateService";

type ReportJobStatus = "queued" | "processing" | "failed" | "complete";

type ReportJobRow = {
  id: string;
  report_id: string;
  user_id: string;
  status: ReportJobStatus;
  attempts: number;
  last_error: string | null;
  locked_at: string | null;
};

const PROCESSING_LOCK_TIMEOUT_MS = 10 * 60 * 1000;

export async function enqueueReportJob(input: {
  reportId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== input.userId) {
    logger.error("Failed auth assertion for report job enqueue.", authError, {
      report_id: input.reportId,
      user_id: input.userId,
      error_type: "service_role_auth_assertion_failed",
    });
    return { ok: false, error: "report_job_enqueue_forbidden" };
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("report_jobs").upsert(
    {
      report_id: input.reportId,
      user_id: input.userId,
      status: "queued",
      locked_at: null,
      last_error: null,
      updated_at: nowIso,
    },
    { onConflict: "report_id" },
  );

  if (error) {
    logger.error("Failed to enqueue report job.", error, {
      report_id: input.reportId,
      user_id: input.userId,
    });
    return { ok: false, error: "report_job_enqueue_failed" };
  }

  return { ok: true };
}

function isExpiredLock(lockedAt: string | null): boolean {
  if (!lockedAt) {
    return true;
  }

  const lockedAtMs = new Date(lockedAt).getTime();
  if (!Number.isFinite(lockedAtMs)) {
    return true;
  }

  return Date.now() - lockedAtMs > PROCESSING_LOCK_TIMEOUT_MS;
}

async function claimJob(row: ReportJobRow): Promise<ReportJobRow | null> {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const baseQuery = admin
    .from("report_jobs")
    .update({
      status: "processing",
      attempts: row.attempts + 1,
      last_error: null,
      locked_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", row.id)
    .eq("status", row.status);

  const query =
    row.locked_at === null
      ? baseQuery.is("locked_at", null)
      : baseQuery.eq("locked_at", row.locked_at);

  const { data, error } = await query
    .select("id, report_id, user_id, status, attempts, last_error, locked_at")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ReportJobRow;
}

async function markJobStatus(
  jobId: string,
  status: ReportJobStatus,
  errorMessage?: string,
) {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status,
    updated_at: nowIso,
    last_error: errorMessage ?? null,
    locked_at: null,
  };

  if (status === "complete") {
    payload.completed_at = nowIso;
  }

  await admin.from("report_jobs").update(payload).eq("id", jobId);
}

async function markReportFailedIfPending(
  reportId: string,
  message: string,
) {
  const admin = createSupabaseAdminClient("worker");
  await admin
    .from("conversion_gap_reports")
    .update({
      status: "failed",
      execution_stage: "failed",
      execution_progress: 100,
      completed_at: new Date().toISOString(),
      gap_analysis: { error: message },
    })
    .eq("id", reportId)
    .in("status", ["queued", "running"]);
}

export async function runReportJobWorker(limit = 20): Promise<{
  scanned: number;
  claimed: number;
  completed: number;
  failed: number;
  requeued: number;
}> {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("report_jobs")
    .select("id, report_id, user_id, status, attempts, last_error, locked_at")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true })
    .limit(Math.max(limit, 1) * 3);

  if (error || !Array.isArray(data)) {
    logger.error("Failed to load report jobs for worker.", error);
    return { scanned: 0, claimed: 0, completed: 0, failed: 0, requeued: 0 };
  }

  let claimed = 0;
  let completed = 0;
  let failed = 0;
  let requeued = 0;

  for (const raw of data as ReportJobRow[]) {
    if (claimed >= limit) {
      break;
    }

    if (raw.status === "processing" && !isExpiredLock(raw.locked_at)) {
      continue;
    }

    const job = await claimJob(raw);
    if (!job) {
      continue;
    }

    claimed += 1;

    try {
      const status = await processQueuedReportJob(job.report_id, job.user_id);
      if (status === "completed") {
        await markJobStatus(job.id, "complete");
        completed += 1;
        continue;
      }

      if (status === "failed") {
        await markReportFailedIfPending(job.report_id, "report_processing_failed");
        await markJobStatus(job.id, "failed", "report_processing_failed");
        failed += 1;
        continue;
      }

      await markJobStatus(job.id, "queued");
      requeued += 1;
    } catch (workerError) {
      const message =
        workerError instanceof Error && workerError.message
          ? workerError.message
          : "report_job_worker_failed";
      logger.error("Report job worker execution failed.", workerError, {
        report_job_id: job.id,
        report_id: job.report_id,
        user_id: job.user_id,
      });
      await markReportFailedIfPending(job.report_id, message);
      await markJobStatus(job.id, "failed", message);
      failed += 1;
    }
  }

  return {
    scanned: data.length,
    claimed,
    completed,
    failed,
    requeued,
  };
}

