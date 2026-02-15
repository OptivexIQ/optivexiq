import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { logger } from "@/lib/logger";
import { errorResponse } from "@/lib/api/errorResponse";
import { readPositioningMapForUser } from "@/features/positioning-map/services/positioningMapReadService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const requestId = randomUUID();
  const resolvedParams = await params;
  const { user, response } = await requireApiUser();
  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  try {
    const result = await readPositioningMapForUser(
      resolvedParams.reportId,
      user.id,
    );
    if (result.status === "not-found") {
      return errorResponse("not_found", "Not found.", 404, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    if (result.status === "forbidden") {
      return errorResponse("forbidden", "Forbidden.", 403, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    return NextResponse.json(
      result.payload,
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    logger.error("Failed to load positioning map.", error, { requestId });
    return errorResponse("internal_error", "Server error.", 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
}
