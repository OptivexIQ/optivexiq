import { randomUUID } from "crypto";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { getGapReport } from "@/features/reports/services/reportService";
import { buildReportExport } from "@/features/reports/services/reportExportService";
import { getGapReportForUser } from "@/features/reports/services/gapReportReadService";

type ExportFormat = "pdf" | "html" | "txt";

function parseFormat(value: string | null): ExportFormat | null {
  if (value === "pdf" || value === "html" || value === "txt") {
    return value;
  }
  return null;
}

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

  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  if (!format) {
    return errorResponse("invalid_payload", "Invalid export format.", 400, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const settingsResult = await getUserSettings(user.id);
  if (!settingsResult.ok || settingsResult.settings.export_restricted) {
    return errorResponse("forbidden", "Exports are restricted.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const executionResult = await getGapReportForUser(resolvedParams.reportId, user.id);
  if (!executionResult) {
    return errorResponse("not_found", "Not found.", 404, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if (
    executionResult.status === "queued" ||
    executionResult.status === "running" ||
    executionResult.status === "retrying"
  ) {
    return errorResponse("conflict", "Export is available only after completion.", 409, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if (executionResult.status === "failed") {
    return errorResponse("conflict", "Failed reports cannot be exported.", 409, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const reportResult = await getGapReport(resolvedParams.reportId);
  if (reportResult.status === "forbidden") {
    return errorResponse("forbidden", "Forbidden.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  if (reportResult.status === "not-found") {
    return errorResponse("not_found", "Not found.", 404, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  if (reportResult.status === "error") {
    return errorResponse("internal_error", reportResult.message, 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  const exported = buildReportExport(reportResult.report, format);
  const binaryBody =
    exported.body instanceof Uint8Array
      ? exported.body.buffer instanceof ArrayBuffer
        ? exported.body.buffer.slice(
            exported.body.byteOffset,
            exported.body.byteOffset + exported.body.byteLength,
          )
        : new Uint8Array(exported.body).buffer
      : null;
  const responseBody: BodyInit =
    typeof exported.body === "string"
      ? exported.body
      : binaryBody ?? "";
  return new Response(responseBody, {
    status: 200,
    headers: {
      "Content-Type": exported.contentType,
      "Content-Disposition": `attachment; filename="${exported.filename}"`,
      "Cache-Control": "no-store",
      "x-request-id": requestId,
    },
  });
}
