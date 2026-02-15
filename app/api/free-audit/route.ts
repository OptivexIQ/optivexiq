import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { freeAuditRequestSchema } from "@/features/free-audit/validators/freeAuditSchema";
import { runFreeAudit } from "@/features/free-audit/services/freeAuditService";
import type { FreeAuditRequest } from "@/features/free-audit/types/freeAudit.types";
import { errorResponse } from "@/lib/api/errorResponse";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const payload = await request.json().catch(() => null);
  const parsed = freeAuditRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const result = runFreeAudit(parsed.data as FreeAuditRequest);
  return NextResponse.json(result, {
    status: 200,
    headers: { "x-request-id": requestId },
  });
}
