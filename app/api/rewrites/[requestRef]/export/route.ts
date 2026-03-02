import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api/errorResponse";
import { logger } from "@/lib/logger";
import { buildRewriteExportDocument } from "@/features/rewrites/services/rewriteExportService";
import { emitRewriteTelemetryEvent } from "@/features/rewrites/services/rewriteTelemetryService";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { createSupabaseServerReadOnlyClient } from "@/services/supabase/server";
import { withGuards } from "@/middleware/withGuards";
import type { RewriteType } from "@/features/rewrites/types/rewrites.types";

const requestRefSchema = z.string().trim().min(3).max(128);
const exportFormatSchema = z.enum(["markdown", "text", "html", "pdf"]);

type RewriteExportRow = {
  request_ref: string;
  experiment_group_id: string | null;
  rewrite_type: RewriteType;
  output_markdown: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ requestRef: string }> },
) {
  return withGuards(request, async ({ userId, requestId }) => {
    const params = await context.params;
    const requestRefParsed = requestRefSchema.safeParse(params.requestRef);
    if (!requestRefParsed.success) {
      return errorResponse("invalid_payload", "Invalid request reference.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const formatParsed = exportFormatSchema.safeParse(
      request.nextUrl.searchParams.get("format"),
    );
    if (!formatParsed.success) {
      return errorResponse("invalid_payload", "Invalid export format.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const requestRef = requestRefParsed.data;
    const format = formatParsed.data;
    const supabase = await createSupabaseServerReadOnlyClient();
    const { data, error } = await supabase
      .from("rewrite_generations")
      .select("request_ref, experiment_group_id, rewrite_type, output_markdown")
      .eq("user_id", userId)
      .eq("request_ref", requestRef)
      .maybeSingle();

    if (error) {
      logger.error("rewrite_export_lookup_failed", error, {
        request_id: requestId,
        user_id: userId,
        request_ref: requestRef,
        format,
      });
      return errorResponse("internal_error", "Unable to load rewrite export.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    if (!data) {
      return errorResponse("not_found", "Rewrite version not found.", 404, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const row = data as RewriteExportRow;
    const document = buildRewriteExportDocument({
      rewriteType: row.rewrite_type,
      outputMarkdown: row.output_markdown,
      format,
    });

    const admin = createSupabaseAdminClient("worker");
    const { error: eventError } = await admin.from("rewrite_export_events").insert({
      user_id: userId,
      request_ref: row.request_ref,
      format,
    });
    if (eventError) {
      logger.error("rewrite_export_event_log_failed", eventError, {
        request_id: requestId,
        user_id: userId,
        request_ref: requestRef,
        format,
      });
      return errorResponse("internal_error", "Unable to log rewrite export.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    logger.info("rewrite_exported", {
      request_id: requestId,
      user_id: userId,
      request_ref: requestRef,
      experiment_group_id: row.experiment_group_id,
      format,
    });
    void emitRewriteTelemetryEvent({
      userId,
      requestId,
      eventType: "rewrite_exported",
      requestRef,
      experimentGroupId: row.experiment_group_id,
      route: "/api/rewrites/[requestRef]/export",
      metadata: { format },
    });

    return new NextResponse(document.content, {
      status: 200,
      headers: {
        "content-type": document.contentType,
        "content-disposition":
          format === "pdf"
            ? `inline; filename="${document.filename}"`
            : `attachment; filename="${document.filename}"`,
        "x-request-id": requestId,
        "x-rewrite-export-format": format,
        "x-rewrite-export-filename": document.filename,
      },
    });
  });
}
