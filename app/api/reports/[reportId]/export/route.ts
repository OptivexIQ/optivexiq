import { randomUUID } from "crypto";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { errorResponse } from "@/lib/api/errorResponse";
import { getUserSettings } from "@/features/settings/services/userSettingsService";
import { buildReportExport } from "@/features/reports/services/reportExportService";
import {
  getCanonicalGapReportExecutionForUser,
} from "@/features/reports/services/canonicalReportReadService";
import { buildCanonicalReportJson } from "@/features/reports/services/reportJsonExportService";

type ExportFormat = "pdf" | "html" | "txt" | "json";

function parseFormat(value: string | null): ExportFormat | null {
  if (value === "pdf" || value === "html" || value === "txt" || value === "json") {
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

  const executionResult = await getCanonicalGapReportExecutionForUser(
    resolvedParams.reportId,
    user.id,
  );
  if (executionResult.status === "not-found") {
    return errorResponse("not_found", "Not found.", 404, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  if (executionResult.status === "forbidden") {
    return errorResponse("forbidden", "Forbidden.", 403, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  if (executionResult.status === "error") {
    return errorResponse("internal_error", executionResult.message, 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  const execution = executionResult.execution;

  if (
    execution.status === "queued" ||
    execution.status === "running" ||
    execution.status === "retrying"
  ) {
    return errorResponse("conflict", "Export is available only after completion.", 409, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if (execution.status === "failed") {
    return errorResponse("conflict", "Failed reports cannot be exported.", 409, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }
  if (!execution.report) {
    return errorResponse("internal_error", "Report data unavailable.", 500, {
      requestId,
      headers: { "x-request-id": requestId },
    });
  }

  if (format === "json") {
    const rawReportData = executionResult.rawReportData;
    if (!rawReportData) {
      return errorResponse("internal_error", "Report data unavailable.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const filename = `optivexiq-${execution.report.company
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "report"}-${execution.report.id}.json`;
    return new Response(buildCanonicalReportJson(rawReportData), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "x-request-id": requestId,
      },
    });
  }

  const exported = buildReportExport(execution.report, format);
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
