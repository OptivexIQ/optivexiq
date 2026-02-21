import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import {
  getGapReportForUser,
  ReportReadQueryError,
} from "@/features/reports/services/gapReportReadService";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const requestId = randomUUID();
  const resolvedParams = await params;
  const { user, response } = await requireApiUser();
  if (response) {
    if (response.status === 401) {
      return errorResponse("forbidden", "Forbidden.", 403, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }
    response.headers.set("x-request-id", requestId);
    return response;
  }
  let report = null;
  try {
    report = await getGapReportForUser(resolvedParams.reportId, user.id);
  } catch (error) {
    if (error instanceof ReportReadQueryError) {
      logger.error("Report API failed to query report state.", {
        report_id: error.reportId,
        user_id: error.userId,
        request_id: requestId,
      });
      return errorResponse("internal_error", "Unable to load report state.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }
    throw error;
  }

  if (!report) {
    return errorResponse("not_found", "Not found.", 404, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  return NextResponse.json(
    { report },
    {
      headers: {
        "x-request-id": requestId,
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
