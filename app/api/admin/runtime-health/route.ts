import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/requireApiRole";

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  const requestId = randomUUID();
  const { response } = await requireApiRole(["admin", "super_admin"]);

  if (response) {
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const mockModeDisabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false";
  const providers = {
    supabase_service_role: hasValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    openai: hasValue(process.env.OPENAI_API_KEY),
    lemonsqueezy_webhook: hasValue(process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
  };

  const providersReady =
    providers.supabase_service_role &&
    providers.openai &&
    providers.lemonsqueezy_webhook;
  const healthy = !isProduction || (mockModeDisabled && providersReady);

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      environment: process.env.NODE_ENV ?? "development",
      checks: {
        mock_mode_disabled: mockModeDisabled ? "ok" : "failed",
        provider_supabase_service_role: providers.supabase_service_role
          ? "ok"
          : "failed",
        provider_openai: providers.openai ? "ok" : "failed",
        provider_lemonsqueezy_webhook: providers.lemonsqueezy_webhook
          ? "ok"
          : "failed",
      },
    },
    { status: healthy ? 200 : 503, headers: { "x-request-id": requestId } },
  );
}
