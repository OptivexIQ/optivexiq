import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import { consumeFreeSnapshotRateLimit } from "@/features/free-snapshot/services/freeSnapshotRateLimitService";
import { freeSnapshotCreateRequestSchema } from "@/features/free-snapshot/validators/freeSnapshotSchema";
import { createFreeSnapshotRequest } from "@/features/free-snapshot/services/freeSnapshotCreateService";
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
  const parsed = freeSnapshotCreateRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if ((parsed.data.honeypot ?? "").trim().length > 0) {
    logger.warn("free_snapshot.bot_submission_rejected", {
      request_id: requestId,
    });
    return errorResponse("forbidden", "Bot submission rejected.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const ipAddress = getClientIp(request);
  const limit = await consumeFreeSnapshotRateLimit(ipAddress);
  if (!limit.allowed) {
    logger.warn("free_snapshot.rate_limited", {
      request_id: requestId,
      ip_address: ipAddress,
    });
    return errorResponse("rate_limited", "Rate limit exceeded.", 429, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const result = await createFreeSnapshotRequest({
    websiteUrl: parsed.data.websiteUrl,
    competitorUrls: parsed.data.competitorUrls ?? [],
    email: parsed.data.email,
    context: parsed.data.context,
    ipAddress,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result.ok) {
    return errorResponse("internal_error", result.error, result.status, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  return NextResponse.json(
    { snapshotId: result.snapshotId, status: result.status },
    { status: 202, headers: { "x-request-id": requestId } },
  );
}
