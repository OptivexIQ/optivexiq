import { httpClient } from "@/lib/api/httpClient";
import type { FreeAuditRequest } from "@/features/free-audit/types/freeAudit.types";

export type FreeAuditStartResponse = {
  snapshotId: string;
  status: "queued";
};

async function submitFreeAudit(
  request: FreeAuditRequest,
): Promise<FreeAuditStartResponse> {
  return httpClient<FreeAuditStartResponse>("/api/free-audit", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function runFreeAuditClient(
  request: FreeAuditRequest,
): Promise<FreeAuditStartResponse> {
  return submitFreeAudit(request);
}
