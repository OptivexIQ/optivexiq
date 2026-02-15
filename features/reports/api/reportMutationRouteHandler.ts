import { NextResponse, type NextRequest } from "next/server";
import { withGuards } from "@/middleware/withGuards";
import { gapEngineRequestSchema } from "@/features/conversion-gap/validators/gapEngineSchema";
import { submitReportMutation } from "@/features/reports/services/reportMutationService";
import { errorResponse } from "@/lib/api/errorResponse";

export async function handleReportMutationRoute(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const body = await request.json().catch(() => null);
    const parsed = gapEngineRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("invalid_payload", "Invalid payload.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    const result = await submitReportMutation({
      userId,
      payload: parsed.data,
      idempotencyKey: idempotencyKey || undefined,
    });

    if (!result.ok) {
      return errorResponse("internal_error", result.error, result.status, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    return NextResponse.json(
      { reportId: result.reportId, status: result.status },
      { status: 202, headers: { "x-request-id": requestId } },
    );
  });
}
