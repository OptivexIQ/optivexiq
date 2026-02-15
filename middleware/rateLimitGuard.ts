import { errorResponse } from "@/lib/api/errorResponse";
import { consumeRateLimit } from "@/features/usage/services/rateLimitService";

export type RateLimitGuardResult = null | { response: Response };

export async function rateLimitGuard(
  ip: string,
  requestId: string,
  pathname: string,
  userId: string | null = null,
): Promise<RateLimitGuardResult> {
  const allowed = await consumeRateLimit(ip, {
    route: pathname,
    userId,
  });
  if (!allowed) {
    return {
      response: errorResponse(
        "rate_limited",
        "Too many requests. Please wait and try again.",
        429,
        {
          requestId,
          headers: { "x-request-id": requestId },
          details: { quota_code: "RATE_LIMIT_EXCEEDED" },
        },
      ),
    };
  }

  return null;
}
