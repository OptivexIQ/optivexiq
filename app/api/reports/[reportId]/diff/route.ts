import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import { getReportDiffForUser } from "@/features/reports/services/reportDiffService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const requestId = randomUUID();
  const resolvedParams = await params;
  const { user, response } = await requireApiUser();
  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const compareTo = new URL(request.url).searchParams.get("compareTo");
  const result = await getReportDiffForUser({
    reportId: resolvedParams.reportId,
    baselineReportId: compareTo,
    userId: user.id,
  });

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

  if (result.status === "conflict") {
    return errorResponse("conflict", result.message, 409, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if (result.status === "error") {
    return errorResponse("internal_error", result.message, 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  return NextResponse.json(result.payload, {
    headers: {
      "x-request-id": requestId,
      "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
