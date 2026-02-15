import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import { getGapReportForUser } from "@/features/reports/services/gapReportReadService";

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

  const report = await getGapReportForUser(resolvedParams.reportId, user.id);
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
