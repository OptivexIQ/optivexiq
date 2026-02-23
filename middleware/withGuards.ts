import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { authGuard, onboardingGuard, planGuard, rateLimitGuard } from ".";

export async function withGuards(
  request: NextRequest,
  handler: (ctx: {
    userId: string;
    requestId: string;
    plan?: string;
  }) => Promise<Response>,
) {
  const requestId = randomUUID();
  const withRequestId = (response: Response) => {
    response.headers.set("x-request-id", requestId);
    return response;
  };

  // Auth
  const authResult = await authGuard(request);
  if ("response" in authResult) {
    return withRequestId(authResult.response);
  }
  const userId = authResult.userId;

  // Rate limit (by IP + user where available)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await rateLimitGuard(
    ip,
    requestId,
    request.nextUrl.pathname,
    userId,
  );
  if (rateLimitResult && rateLimitResult.response) {
    return withRequestId(rateLimitResult.response);
  }

  // Onboarding completion guard for protected mutation paths.
  const onboardingResult = await onboardingGuard(
    request.nextUrl.pathname,
    userId,
    requestId,
  );
  if (onboardingResult && onboardingResult.response) {
    return withRequestId(onboardingResult.response);
  }

  // Plan/Quota
  const planResult = await planGuard(
    request.nextUrl.pathname,
    userId,
    requestId,
  );
  if (planResult && planResult.response) {
    return withRequestId(planResult.response);
  }

  // Optionally, fetch plan info here if needed
  // const plan = ...

  return handler({ userId, requestId });
}
