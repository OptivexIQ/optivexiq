import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/errorResponse";
import { logger } from "@/lib/logger";
import type { StatusPayload } from "@/features/status/types/status.types";
import { getLiveStatusPayload } from "@/features/status/services/statusService";
import { consumeStatusRateLimit } from "@/features/status/services/statusRateLimitService";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) {
    return null;
  }
  return forwarded.split(",")[0]?.trim() || null;
}

function buildSafeDegradedStatus(updatedAt: string): StatusPayload {
  return {
    overall: {
      status: "degraded",
      message: "Status is temporarily limited while we investigate a monitoring issue.",
      updatedAt,
    },
    components: [
      {
        key: "web",
        name: "Website & Dashboard",
        description: "Public site and authenticated dashboard availability.",
        status: "degraded",
        updatedAt,
        detail: "Status signal temporarily unavailable.",
      },
      {
        key: "analysis",
        name: "Analysis Engine (Snapshot + Full Reports)",
        description: "Processes analysis requests and report generation.",
        status: "degraded",
        updatedAt,
        detail: "Status signal temporarily unavailable.",
      },
      {
        key: "billing",
        name: "Billing & Account Services",
        description: "Handles checkout confirmation and account entitlement updates.",
        status: "degraded",
        updatedAt,
        detail: "Status signal temporarily unavailable.",
      },
      {
        key: "email",
        name: "Email Delivery",
        description: "Snapshot PDF delivery and notification sending.",
        status: "degraded",
        updatedAt,
        detail: "Status signal temporarily unavailable.",
      },
    ],
    incidents: [],
    meta: {
      refreshSeconds: 60,
      dataSourceNote: "Derived from internal health checks and operational monitoring.",
      signalDegraded: true,
      support: {
        contactUrl: "/contact",
        email: "support@optivexiq.com",
        securityEmail: "security@optivexiq.com",
      },
    },
  };
}

export async function GET(request: Request) {
  const requestId = randomUUID();
  const ipAddress = getClientIp(request);

  const rateLimit = await consumeStatusRateLimit(ipAddress);
  if (!rateLimit.allowed) {
    logger.warn("status.rate_limited", {
      request_id: requestId,
      ip_address: ipAddress,
      reason: rateLimit.reason,
    });
    return errorResponse("rate_limited", "Rate limit exceeded.", 429, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  try {
    const payload = await getLiveStatusPayload();
    return NextResponse.json(payload, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    logger.error("status.payload_generation_failed", error, {
      request_id: requestId,
    });

    return NextResponse.json(buildSafeDegradedStatus(new Date().toISOString()), {
      status: 200,
      headers: {
        "x-request-id": requestId,
        "x-status-signal": "degraded",
      },
    });
  }
}
