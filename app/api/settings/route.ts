import { NextResponse, type NextRequest } from "next/server";
import { withGuards } from "@/middleware/withGuards";
import { errorResponse } from "@/lib/api/errorResponse";
import {
  getUserSettings,
  updateUserSettings,
} from "@/features/settings/services/userSettingsService";
import {
  userSettingsSchema,
  type UserSettingsPayload,
} from "@/features/settings/validators/userSettingsSchema";

export async function GET(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const result = await getUserSettings(userId);
    if (!result.ok) {
      return errorResponse("internal_error", result.error, 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    return NextResponse.json(result.settings, {
      headers: { "x-request-id": requestId },
    });
  });
}

export async function PATCH(request: NextRequest) {
  return withGuards(request, async ({ userId, requestId }) => {
    const body = await request.json().catch(() => null);
    const parsed = userSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("invalid_payload", "Invalid payload.", 400, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    const payload = parsed.data as UserSettingsPayload;
    const result = await updateUserSettings(userId, payload);
    if (!result.ok) {
      return errorResponse("internal_error", result.error, 500, {
        requestId,
        headers: { "x-request-id": requestId },
      });
    }

    return NextResponse.json(result.settings, {
      headers: { "x-request-id": requestId },
    });
  });
}
