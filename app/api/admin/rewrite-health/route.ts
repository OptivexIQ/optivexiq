import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";
import { getRewriteHealthSnapshot } from "@/features/rewrites/services/rewriteTelemetryService";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const { response } = await requireApiRole(["admin", "super_admin"]);
  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const url = new URL(request.url);
  const windowHoursRaw = Number(url.searchParams.get("windowHours") ?? 24);
  const windowHours = Number.isFinite(windowHoursRaw)
    ? Math.min(168, Math.max(1, Math.floor(windowHoursRaw)))
    : 24;

  try {
    const snapshot = await getRewriteHealthSnapshot({ windowHours });
    const status = snapshot.recentFailureRate > 0.2 ? "degraded" : "ok";
    return NextResponse.json(
      {
        status,
        windowHours,
        metrics: {
          recent_failure_rate: snapshot.recentFailureRate,
          avg_latency_ms: snapshot.avgLatencyMs,
          token_drift: snapshot.avgTokenDrift,
          experiment_creation_rate_per_hour: snapshot.experimentCreationRatePerHour,
        },
        counters: {
          started: snapshot.started,
          completed: snapshot.completed,
          failed: snapshot.failed,
        },
      },
      {
        status: status === "ok" ? 200 : 503,
        headers: { "x-request-id": requestId },
      },
    );
  } catch {
    return NextResponse.json(
      {
        status: "unknown",
        windowHours,
        error: "Unable to compute rewrite health snapshot.",
      },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }
}
