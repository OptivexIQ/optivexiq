import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import {
  analyzeFreeSnapshotFromInput,
  scrapeFreeSnapshotCompetitorContents,
  scrapeFreeSnapshotWebsiteContent,
} from "@/features/free-snapshot/services/freeSnapshotService";
import {
  getFreeSnapshotById,
  setFreeSnapshotFailure,
  updateFreeSnapshotStatus,
} from "@/features/free-snapshot/services/freeSnapshotRepository";

type FreeSnapshotJobStatus = "queued" | "processing" | "failed" | "complete";

type FreeSnapshotJobRow = {
  id: string;
  snapshot_id: string;
  status: FreeSnapshotJobStatus;
  attempts: number;
  locked_at: string | null;
};

const PROCESSING_LOCK_TIMEOUT_MS = 10 * 60 * 1000;

function lockExpired(lockedAt: string | null) {
  if (!lockedAt) {
    return true;
  }

  const parsed = new Date(lockedAt).getTime();
  if (!Number.isFinite(parsed)) {
    return true;
  }

  return Date.now() - parsed > PROCESSING_LOCK_TIMEOUT_MS;
}

export async function enqueueFreeSnapshotJob(snapshotId: string) {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const { error } = await admin.from("free_snapshot_jobs").upsert(
    {
      snapshot_id: snapshotId,
      status: "queued",
      locked_at: null,
      last_error: null,
      updated_at: nowIso,
    },
    { onConflict: "snapshot_id" },
  );

  if (error) {
    logger.error("Failed to enqueue free snapshot job.", error, {
      snapshot_id: snapshotId,
    });
    return { ok: false as const, error: "free_snapshot_job_enqueue_failed" };
  }

  return { ok: true as const };
}

export function dispatchFreeSnapshotWorker(reason: string) {
  void runFreeSnapshotJobWorker(1).catch((error) => {
    logger.error("free_snapshot.worker_dispatch_failed", error, {
      reason,
    });
  });
}

async function claimJob(job: FreeSnapshotJobRow) {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const base = admin
    .from("free_snapshot_jobs")
    .update({
      status: "processing",
      attempts: job.attempts + 1,
      locked_at: nowIso,
      last_error: null,
      updated_at: nowIso,
    })
    .eq("id", job.id)
    .eq("status", job.status);

  const query =
    job.locked_at === null ? base.is("locked_at", null) : base.eq("locked_at", job.locked_at);
  const { data, error } = await query
    .select("id, snapshot_id, status, attempts, locked_at")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as FreeSnapshotJobRow;
}

async function markJob(input: {
  jobId: string;
  status: FreeSnapshotJobStatus;
  errorMessage?: string;
}) {
  const admin = createSupabaseAdminClient("worker");
  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    status: input.status,
    last_error: input.errorMessage ?? null,
    locked_at: null,
    updated_at: nowIso,
  };
  if (input.status === "complete") {
    payload.completed_at = nowIso;
  }

  await admin.from("free_snapshot_jobs").update(payload).eq("id", input.jobId);
}

async function processSnapshot(snapshotId: string) {
  const started = Date.now();
  const snapshot = await getFreeSnapshotById(snapshotId);
  if (!snapshot) {
    throw new Error("free_snapshot_not_found");
  }

  const competitorUrls = Array.isArray(snapshot.competitor_urls)
    ? snapshot.competitor_urls.filter((item): item is string => typeof item === "string")
    : [];

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "scraping",
    executionStage: "fetching_homepage_content",
  });

  const websiteText = await scrapeFreeSnapshotWebsiteContent(snapshot.website_url);

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "scraping",
    executionStage: "extracting_positioning_signals",
  });

  let competitorTexts: Array<{ url: string; text: string }> = [];
  if (competitorUrls.length > 0) {
    await updateFreeSnapshotStatus({
      snapshotId,
      status: "scraping",
      executionStage: "analyzing_competitor_structure",
    });
    competitorTexts = await scrapeFreeSnapshotCompetitorContents(competitorUrls);
  }

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "analyzing",
    executionStage: "generating_executive_diagnosis",
  });

  const generated = await analyzeFreeSnapshotFromInput({
    websiteUrl: snapshot.website_url,
    competitorUrls,
    context: snapshot.analysis_context ?? undefined,
    websiteText,
    competitorTexts,
  });

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "analyzing",
    executionStage: "scoring_conversion_gaps",
    snapshotData: generated.snapshot,
  });

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "generating",
    executionStage: "finalizing_snapshot",
    snapshotData: generated.snapshot,
  });

  await updateFreeSnapshotStatus({
    snapshotId,
    status: "completed",
    executionStage: null,
    snapshotData: generated.snapshot,
  });

  logger.info("Free snapshot completed.", {
    snapshot_id: snapshotId,
    duration_ms: Date.now() - started,
    input_tokens: generated.usage.inputTokens,
    output_tokens: generated.usage.outputTokens,
  });
}

export async function runFreeSnapshotJobWorker(limit = 10) {
  const admin = createSupabaseAdminClient("worker");
  const { data, error } = await admin
    .from("free_snapshot_jobs")
    .select("id, snapshot_id, status, attempts, locked_at")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: true })
    .limit(Math.max(1, limit) * 3);

  if (error || !Array.isArray(data)) {
    logger.error("Failed to load free snapshot jobs.", error);
    return { scanned: 0, claimed: 0, completed: 0, failed: 0 };
  }

  let claimed = 0;
  let completed = 0;
  let failed = 0;

  for (const raw of data as FreeSnapshotJobRow[]) {
    if (claimed >= limit) {
      break;
    }
    if (raw.status === "processing" && !lockExpired(raw.locked_at)) {
      continue;
    }

    const job = await claimJob(raw);
    if (!job) {
      continue;
    }
    claimed += 1;

    try {
      await processSnapshot(job.snapshot_id);
      await markJob({ jobId: job.id, status: "complete" });
      completed += 1;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "free_snapshot_processing_failed";
      logger.error("Free snapshot job failed.", error, {
        job_id: job.id,
        snapshot_id: job.snapshot_id,
      });
      await setFreeSnapshotFailure({ snapshotId: job.snapshot_id, message });
      await markJob({ jobId: job.id, status: "failed", errorMessage: message });
      failed += 1;
    }
  }

  const failureRate = claimed > 0 ? Number((failed / claimed).toFixed(4)) : 0;
  logger.info("free_snapshot.worker_run_summary", {
    scanned: data.length,
    claimed,
    completed,
    failed,
    failure_rate: failureRate,
  });

  return { scanned: data.length, claimed, completed, failed, failureRate };
}
