import { randomUUID } from "crypto";
import { z } from "zod";
import { errorResponse } from "@/lib/api/errorResponse";
import { generateFreeSnapshotDownload } from "@/features/free-snapshot/services/freeSnapshotDownloadService";
import { sendSnapshotEmail } from "@/features/free-snapshot/email/sendSnapshotEmail";
import { logger } from "@/lib/logger";
import { consumeFreeSnapshotDownloadRateLimit } from "@/features/free-snapshot/services/freeSnapshotRateLimitService";

const requestSchema = z.object({
  snapshotId: z.string().uuid(),
  email: z.string().email(),
});

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
  const parsed = requestSchema.safeParse(payload);

  if (!parsed.success) {
    return errorResponse("invalid_payload", "Invalid payload.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const ipAddress = getClientIp(request);
  const rateLimit = await consumeFreeSnapshotDownloadRateLimit({
    ipAddress,
    email: parsed.data.email,
  });
  if (!rateLimit.allowed) {
    logger.warn("free_snapshot.download_rate_limited", {
      request_id: requestId,
      ip_address: ipAddress,
      email: parsed.data.email,
    });
    return errorResponse("rate_limited", "Rate limit exceeded.", 429, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const result = await generateFreeSnapshotDownload({
    snapshotId: parsed.data.snapshotId,
    email: parsed.data.email,
  });

  if (!result.ok) {
    return errorResponse("internal_error", result.error, result.status, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  try {
    await sendSnapshotEmail({
      email: parsed.data.email,
      pdfBuffer: result.pdf,
      website: result.website,
      snapshotId: result.snapshotId,
    });
  } catch (error) {
    logger.error("free_snapshot.download_email_delivery_failed", error, {
      request_id: requestId,
      snapshot_id: parsed.data.snapshotId,
      email: parsed.data.email,
    });
  }

  return new Response(new Uint8Array(result.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.filename}"`,
      "x-request-id": requestId,
    },
  });
}
