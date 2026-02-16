import {
  createQueuedFreeSnapshot,
  findRecentReusableSnapshotByEmailAndWebsite,
  findRecentSnapshotByEmailAndWebsite,
} from "@/features/free-snapshot/services/freeSnapshotRepository";
import {
  dispatchFreeSnapshotWorker,
  enqueueFreeSnapshotJob,
} from "@/features/free-snapshot/services/freeSnapshotJobQueueService";
import { logger } from "@/lib/logger";

export async function createFreeSnapshotRequest(input: {
  websiteUrl: string;
  competitorUrls: string[];
  email?: string;
  context?: string;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  if (input.email) {
    const existing = await findRecentReusableSnapshotByEmailAndWebsite({
      email: input.email,
      websiteUrl: input.websiteUrl,
    });

    if (existing) {
      if (existing.status === "queued" || existing.status === "scraping") {
        dispatchFreeSnapshotWorker("dedupe_reused_snapshot");
      }

      return {
        ok: true as const,
        snapshotId: existing.id,
        status: existing.status,
      };
    }
  }

  const created = await createQueuedFreeSnapshot(input);
  if (!created.ok) {
    return { ok: false as const, status: 500, error: "Unable to create snapshot." };
  }

  const enqueued = await enqueueFreeSnapshotJob(created.snapshotId);
  if (!enqueued.ok) {
    logger.error("Free snapshot queue enqueue failed.", undefined, {
      snapshot_id: created.snapshotId,
    });
    return { ok: false as const, status: 500, error: "Unable to enqueue snapshot processing." };
  }

  dispatchFreeSnapshotWorker("snapshot_created");

  return {
    ok: true as const,
    snapshotId: created.snapshotId,
    status: created.status,
  };
}

export async function getRecentCompletedSnapshotByLead(input: {
  email: string;
  websiteUrl: string;
}) {
  return findRecentSnapshotByEmailAndWebsite(input);
}
