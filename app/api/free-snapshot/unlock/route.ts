import { randomUUID } from "crypto";
import { errorResponse } from "@/lib/api/errorResponse";
import { freeSnapshotUnlockRequestSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";
import { unlockFreeSnapshot } from "@/features/free-snapshot/services/freeSnapshotUnlockService";
import { consumeFreeSnapshotUnlockRateLimit } from "@/features/free-snapshot/services/freeSnapshotRateLimitService";
import { logger } from "@/lib/logger";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }
  return forwarded.split(",")[0]?.trim() || null;
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const payload = await request.json().catch(() => null);
  const parsed = freeSnapshotUnlockRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if ((parsed.data.honeypot ?? "").trim().length > 0) {
    return errorResponse("forbidden", "Bot submission rejected.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const ipAddress = getClientIp(request);
  const rateLimit = await consumeFreeSnapshotUnlockRateLimit({
    ipAddress,
    email: parsed.data.email,
  });
  if (!rateLimit.allowed) {
    logger.warn("free_snapshot.unlock_rate_limited", {
      request_id: requestId,
      ip_address: ipAddress,
      email: parsed.data.email,
    });
    return errorResponse("rate_limited", "Rate limit exceeded.", 429, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const result = await unlockFreeSnapshot({
    snapshotId: parsed.data.snapshotId,
    email: parsed.data.email,
    consent: parsed.data.consent ?? false,
  });

  if (!result.ok) {
    return errorResponse("internal_error", result.error, result.status, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  return new Response(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "x-request-id": requestId,
    },
  });
}
