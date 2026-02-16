import { httpClient } from "@/lib/api/httpClient";
import type {
  FreeConversionSnapshot,
  FreeSnapshotExecutionStage,
  FreeSnapshotStatus,
} from "@/features/free-snapshot/types/freeSnapshot.types";

export type StartFreeSnapshotPayload = {
  websiteUrl: string;
  competitorUrls: string[];
  email?: string;
  context?: string;
  honeypot?: string;
  captchaToken?: string;
};

export type StartFreeSnapshotResponse = {
  snapshotId: string;
  status: FreeSnapshotStatus;
};

export type FreeSnapshotStatusResponse = {
  snapshotId: string;
  status: FreeSnapshotStatus;
  executionStage: FreeSnapshotExecutionStage | null;
  snapshot: FreeConversionSnapshot | null;
  error: string | null;
  websiteUrl: string;
  competitorCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function startFreeSnapshot(
  payload: StartFreeSnapshotPayload,
): Promise<StartFreeSnapshotResponse> {
  return httpClient<StartFreeSnapshotResponse>("/api/free-snapshot", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFreeSnapshotStatus(
  snapshotId: string,
): Promise<FreeSnapshotStatusResponse> {
  return httpClient<FreeSnapshotStatusResponse>(
    `/api/free-snapshot/${snapshotId}/status`,
  );
}

export async function unlockFreeSnapshot(payload: {
  snapshotId: string;
  email: string;
  consent: boolean;
  honeypot?: string;
  captchaToken?: string;
}): Promise<Blob> {
  const response = await fetch("/api/free-snapshot/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Unable to unlock snapshot.";
    try {
      const data = (await response.json()) as { error?: { message?: string } };
      if (data?.error?.message) {
        message = data.error.message;
      }
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  return response.blob();
}
