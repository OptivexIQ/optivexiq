import { getFreeSnapshotById } from "@/features/free-snapshot/services/freeSnapshotRepository";
import { dispatchFreeSnapshotWorker } from "@/features/free-snapshot/services/freeSnapshotJobQueueService";
import { freeConversionSnapshotSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";

function resolveCompetitorCount(value: unknown): number {
  if (!Array.isArray(value)) {
    return 0;
  }

  return value.filter((item) => typeof item === "string" && item.trim().length > 0)
    .length;
}

function secondsSince(iso: string): number {
  const value = new Date(iso).getTime();
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.floor((Date.now() - value) / 1000);
}

export async function getFreeSnapshotStatus(snapshotId: string) {
  const row = await getFreeSnapshotById(snapshotId);
  if (!row) {
    return { ok: false as const, status: 404, error: "Snapshot not found." };
  }

  if (row.status === "queued" && secondsSince(row.updated_at) >= 10) {
    dispatchFreeSnapshotWorker("status_probe_queued_snapshot");
  }

  let snapshot = null;
  if (row.snapshot_data && typeof row.snapshot_data === "object") {
    const parsed = freeConversionSnapshotSchema.safeParse(row.snapshot_data);
    if (parsed.success) {
      snapshot = parsed.data;
    }
  }

  return {
    ok: true as const,
    data: {
      snapshotId: row.id,
      status: row.status,
      executionStage: row.execution_stage,
      snapshot,
      error: row.error_message,
      websiteUrl: row.website_url,
      competitorCount: resolveCompetitorCount(row.competitor_urls),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}
