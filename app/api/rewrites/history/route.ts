import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuards } from "@/middleware/withGuards";
import { errorResponse } from "@/lib/api/errorResponse";
import { listRewriteHistoryForUser } from "@/features/rewrites/services/rewriteHistoryReadService";
import { mapRewriteHistoryRecordToStudioVersion } from "@/features/rewrites/services/rewriteStudioHistoryMapper";

const limitSchema = z.coerce.number().int().min(1).max(50).default(20);

export async function GET(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const limitParsed = limitSchema.safeParse(
      request.nextUrl.searchParams.get("limit") ?? undefined,
    );
    if (!limitParsed.success) {
      return errorResponse("invalid_payload", "Invalid history limit.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const history = await listRewriteHistoryForUser(userId, limitParsed.data);
    return NextResponse.json(
      {
        versions: history.map(mapRewriteHistoryRecordToStudioVersion),
      },
      {
        status: 200,
        headers: { "x-request-id": requestId },
      },
    );
  });
}
