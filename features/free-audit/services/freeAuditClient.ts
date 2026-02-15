import { resolveData } from "@/lib/data/dataSource";
import { httpClient } from "@/lib/api/httpClient";
import { runFreeAudit } from "@/features/free-audit/services/freeAuditService";
import type {
  FreeAuditRequest,
  FreeAuditResult,
} from "@/features/free-audit/types/freeAudit.types";

async function submitFreeAudit(
  request: FreeAuditRequest,
): Promise<FreeAuditResult> {
  return httpClient<FreeAuditResult>("/api/free-audit", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function runFreeAuditClient(
  request: FreeAuditRequest,
): Promise<FreeAuditResult> {
  return resolveData(
    "free-audit",
    () => submitFreeAudit(request),
    () => runFreeAudit(request),
  );
}
