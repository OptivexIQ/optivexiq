import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/api/errorResponse";
import { withGuards } from "@/middleware/withGuards";
import { mapOriginalDraftSections } from "@/features/rewrites/services/rewriteSectionMapService";
import { rewriteSectionMapRequestSchema } from "@/features/rewrites/validators/rewriteSectionMapSchema";

const sectionMapApiResponseSchema = z.object({
  source: z.enum(["deterministic", "ai"]),
  sections: z.array(
    z.object({
      title: z.string().min(1).max(64),
      body: z.string().min(1).max(10000),
    }),
  ),
  warnings: z.array(z.string().min(1).max(256)).default([]),
  model: z.string().nullable(),
});

export async function POST(request: NextRequest) {
  return withGuards(request, async ({ requestId, userId }) => {
    const body = await request.json().catch(() => null);
    const parsed = rewriteSectionMapRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("invalid_payload", "Invalid section-map payload.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const result = await mapOriginalDraftSections({
      ...parsed.data,
      userId,
    });
    if (!result.ok) {
      return errorResponse("internal_error", result.error, 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const outbound = sectionMapApiResponseSchema.safeParse({
      source: result.source,
      sections: result.sections,
      warnings: result.warnings,
      model: result.model,
    });
    if (!outbound.success) {
      return errorResponse(
        "internal_error",
        "Invalid section-map response contract.",
        500,
        {
          requestId,
          headers: { "x-request-id": requestId },
        },
      );
    }

    return NextResponse.json(
      {
        source: result.source,
        sections: result.sections,
        warnings: result.warnings,
        model: result.model,
      },
      { headers: { "x-request-id": requestId } },
    );
  });
}
