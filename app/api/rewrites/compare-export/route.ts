import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withGuards } from "@/middleware/withGuards";
import { errorResponse } from "@/lib/api/errorResponse";
import { logger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { createSupabaseServerReadOnlyClient } from "@/services/supabase/server";
import { emitRewriteTelemetryEvent } from "@/features/rewrites/services/rewriteTelemetryService";
import { buildSimplePdfFromMarkdown } from "@/features/rewrites/services/rewriteExportService";

const payloadSchema = z
  .object({
    controlRequestRef: z.string().trim().min(3).max(128).optional(),
    treatmentRequestRefs: z.array(z.string().trim().min(3).max(128)).optional(),
    experimentGroupId: z.string().uuid().optional(),
    selectedRequestRefs: z.array(z.string().trim().min(3).max(128)).optional(),
    format: z.enum(["markdown", "html", "pdf"]),
  })
  .superRefine((value, ctx) => {
    const hasRefMode =
      Boolean(value.controlRequestRef) &&
      Array.isArray(value.treatmentRequestRefs) &&
      value.treatmentRequestRefs.length > 0;
    const hasExperimentMode =
      Boolean(value.experimentGroupId) &&
      Array.isArray(value.selectedRequestRefs) &&
      value.selectedRequestRefs.length > 0;
    if (!hasRefMode && !hasExperimentMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Provide control+treatment request refs or experiment_group_id+selected refs.",
        path: ["controlRequestRef"],
      });
    }
  });

type RewriteRow = {
  request_ref: string;
  experiment_group_id: string | null;
  version_number: number;
  parent_request_ref: string | null;
  is_control: boolean;
  control_request_ref: string | null;
  is_winner: boolean;
  winner_label: string | null;
  hypothesis_type: string | null;
  controlled_variables: unknown;
  treatment_variables: unknown;
  success_criteria: string | null;
  minimum_delta_level: string | null;
  delta_metrics: Record<string, unknown> | null;
  prompt_version: number | null;
  system_template_version: number | null;
  model_temperature: number | null;
  rewrite_type: "homepage" | "pricing";
  output_markdown: string;
  created_at: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toComparisonMarkdown(rows: RewriteRow[], controlRef: string | null) {
  const lines: string[] = [];
  lines.push("# Rewrite Comparison Export");
  lines.push("");
  for (const row of rows) {
    const role =
      row.is_control || (controlRef && row.request_ref === controlRef)
        ? "Control"
        : "Treatment";
    const title = row.rewrite_type === "pricing" ? "Pricing" : "Homepage";
    lines.push(`## ${role} | ${title} | ${row.request_ref}`);
    lines.push(`- Version: ${row.version_number}`);
    lines.push(`- Created: ${row.created_at}`);
    lines.push(
      `- Parent version: ${row.parent_request_ref ? row.parent_request_ref : "N/A"}`,
    );
    lines.push(
      `- Control ref: ${row.control_request_ref ? row.control_request_ref : "N/A"}`,
    );
    if (row.is_winner) {
      lines.push(
        `- Winner: yes${row.winner_label ? ` (${row.winner_label})` : ""}`,
      );
    } else {
      lines.push("- Winner: no");
    }
    const controlledVariables = Array.isArray(row.controlled_variables)
      ? row.controlled_variables.filter((item): item is string => typeof item === "string")
      : [];
    const treatmentVariables = Array.isArray(row.treatment_variables)
      ? row.treatment_variables.filter((item): item is string => typeof item === "string")
      : [];
    lines.push(`- Hypothesis type: ${row.hypothesis_type ?? "N/A"}`);
    lines.push(
      `- Controlled variables: ${controlledVariables.length > 0 ? controlledVariables.join(", ") : "N/A"}`,
    );
    lines.push(
      `- Treatment variables: ${treatmentVariables.length > 0 ? treatmentVariables.join(", ") : "N/A"}`,
    );
    lines.push(`- Success criteria: ${row.success_criteria ?? "N/A"}`);
    lines.push(`- Minimum delta level: ${row.minimum_delta_level ?? "N/A"}`);
    lines.push(
      `- Prompt/system versions: ${row.prompt_version ?? "N/A"} / ${row.system_template_version ?? "N/A"}`,
    );
    lines.push(
      `- Model temperature: ${typeof row.model_temperature === "number" ? row.model_temperature.toFixed(2) : "N/A"}`,
    );
    lines.push(
      `- Delta metrics: ${
        row.delta_metrics && typeof row.delta_metrics === "object"
          ? JSON.stringify(row.delta_metrics)
          : "N/A"
      }`,
    );
    lines.push("");
    lines.push(row.output_markdown.trim());
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function toHtmlDocument(markdown: string) {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    "  <title>Rewrite Comparison Export</title>",
    "  <style>",
    "    body { font-family: Inter, Arial, sans-serif; margin: 24px; color: #111827; line-height: 1.6; }",
    "    pre { white-space: pre-wrap; word-break: break-word; margin: 0; }",
    "  </style>",
    "</head>",
    "<body>",
    `  <pre>${escapeHtml(markdown)}</pre>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_payload", "Invalid compare export payload.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const payload = parsed.data;
    const requestRefs = new Set<string>();
    if (payload.controlRequestRef) {
      requestRefs.add(payload.controlRequestRef);
    }
    for (const ref of payload.treatmentRequestRefs ?? []) {
      requestRefs.add(ref);
    }
    for (const ref of payload.selectedRequestRefs ?? []) {
      requestRefs.add(ref);
    }
    const refs = Array.from(requestRefs);

    const supabase = await createSupabaseServerReadOnlyClient();
    const { data, error } = await supabase
      .from("rewrite_generations")
      .select(
        "request_ref, experiment_group_id, version_number, parent_request_ref, is_control, control_request_ref, is_winner, winner_label, hypothesis_type, controlled_variables, treatment_variables, success_criteria, minimum_delta_level, delta_metrics, prompt_version, system_template_version, model_temperature, rewrite_type, output_markdown, created_at",
      )
      .eq("user_id", userId)
      .in("request_ref", refs);

    if (error) {
      logger.error("rewrite_compare_export_lookup_failed", error, {
        request_id: requestId,
        user_id: userId,
      });
      return errorResponse("internal_error", "Unable to load compare versions.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const rows = (data ?? []) as RewriteRow[];
    if (rows.length !== refs.length) {
      return errorResponse("forbidden", "One or more versions are unavailable.", 403, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    if (payload.experimentGroupId) {
      const mismatch = rows.some(
        (row) => row.experiment_group_id !== payload.experimentGroupId,
      );
      if (mismatch) {
        return errorResponse(
          "forbidden",
          "Selected versions must belong to the same experiment.",
          403,
          { requestId, headers: { "x-request-id": requestId } },
        );
      }
    }

    const orderedRows = rows.sort((a, b) => a.version_number - b.version_number);
    const markdown = toComparisonMarkdown(
      orderedRows,
      payload.controlRequestRef ?? null,
    );
    const content =
      payload.format === "markdown"
        ? markdown
        : payload.format === "pdf"
          ? buildSimplePdfFromMarkdown(markdown)
          : toHtmlDocument(markdown);
    const contentType =
      payload.format === "markdown"
        ? "text/markdown; charset=utf-8"
        : payload.format === "pdf"
          ? "application/pdf"
          : "text/html; charset=utf-8";
    const extension =
      payload.format === "markdown" ? "md" : payload.format === "html" ? "html" : "pdf";
    const filename = `rewrite-comparison.${extension}`;

    const admin = createSupabaseAdminClient("worker");
    const exportEvents = orderedRows.map((row) => ({
      user_id: userId,
      request_ref: row.request_ref,
      format: payload.format,
    }));
    const { error: eventError } = await admin
      .from("rewrite_export_events")
      .insert(exportEvents);
    if (eventError) {
      logger.error("rewrite_compare_export_event_log_failed", eventError, {
        request_id: requestId,
        user_id: userId,
      });
      return errorResponse("internal_error", "Unable to log compare export.", 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    void emitRewriteTelemetryEvent({
      userId,
      requestId,
      eventType: "rewrite_exported",
      requestRef: payload.controlRequestRef ?? orderedRows[0]?.request_ref ?? null,
      experimentGroupId: orderedRows[0]?.experiment_group_id ?? null,
      route: "/api/rewrites/compare-export",
      metadata: {
        format: payload.format,
        audit_action: "compare_export",
        exported_request_refs: orderedRows.map((row) => row.request_ref),
      },
    });

    return new NextResponse(content, {
      status: 200,
      headers: {
        "content-type": contentType,
        "content-disposition":
          payload.format === "pdf"
            ? `inline; filename="${filename}"`
            : `attachment; filename="${filename}"`,
        "x-request-id": requestId,
      },
    });
  });
}
