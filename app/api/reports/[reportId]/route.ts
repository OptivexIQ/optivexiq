import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import {
  getGapReportForUser,
  ReportDataIntegrityError,
} from "@/features/reports/services/gapReportReadService";
import { logger } from "@/lib/logger";

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

  let report;
  try {
    report = await getGapReportForUser(resolvedParams.reportId, user.id);
  } catch (error) {
    if (error instanceof ReportDataIntegrityError) {
      logger.error("Report API rejected corrupt canonical report_data.", {
        report_id: error.reportId,
        user_id: error.userId,
        request_id: requestId,
      });
      return errorResponse(
        "internal_error",
        "Report data integrity fault.",
        500,
        {
          requestId,
          headers: { "x-request-id": requestId },
        },
      );
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
    { headers: { "x-request-id": requestId } },
  );
}
