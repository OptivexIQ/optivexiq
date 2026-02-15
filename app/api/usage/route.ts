import { NextResponse, type NextRequest } from "next/server";
import { withGuards } from "@/middleware/withGuards";
import { usageGuard } from "@/middleware/usageGuard";
import { getUsageSummary } from "@/features/usage/services/usageSummaryService";
import { errorResponse } from "@/lib/api/errorResponse";

export async function GET(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const guardResult = await usageGuard(userId, requestId, request.nextUrl.pathname);
    if ("response" in guardResult) {
      guardResult.response.headers.set("x-request-id", requestId);
      return guardResult.response;
    }

    const result = await getUsageSummary(userId, guardResult.subscription);
    if (!result.ok) {
      return errorResponse("internal_error", result.error, result.status, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    return NextResponse.json(result.data, {
      headers: { "x-request-id": requestId },
    });
  });
}
