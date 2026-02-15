import { errorResponse } from "@/lib/api/errorResponse";
import { hasActiveSubscription } from "@/features/billing/services/planValidationService";
import { ensureBillingPeriodValid } from "@/features/usage/services/billingPeriodReset";
import {
  assertCanCreateGapReport,
  assertCanGenerate,
  type QuotaError,
} from "@/features/usage/services/quotaEnforcer";
import { getQuotaActionForPath } from "@/middleware/guardPolicy";
import { logger } from "@/lib/logger";

function isQuotaError(error: unknown): error is QuotaError {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && "message" in error && "upgrade_required" in error;
}

export function isQuotaPath(pathname: string) {
  return Boolean(getQuotaActionForPath(pathname));
}

export type PlanGuardResult = null | { response: Response };

export async function planGuard(
  pathname: string,
  userId: string,
  requestId: string,
): Promise<PlanGuardResult> {
  const timestamp = new Date().toISOString();
  const action = getQuotaActionForPath(pathname);
  if (!action) {
    return null;
  }

  const hasSubscription = await hasActiveSubscription(userId);
  if (!hasSubscription) {
    logger.warn("plan_guard_denied", {
      user_id: userId,
      route: pathname,
      quota_state: "no_active_subscription",
      denial_reason: "NO_ACTIVE_SUBSCRIPTION",
      timestamp,
      request_id: requestId,
    });
    return {
      response: errorResponse(
        "forbidden",
        "Active subscription required.",
        403,
        {
          requestId,
          headers: { "x-request-id": requestId },
          details: {
            quota_code: "NO_ACTIVE_SUBSCRIPTION",
            upgrade_required: true,
          },
        },
      ),
    };
  }

  await ensureBillingPeriodValid(userId);

  try {
    if (action === "generate") {
      await assertCanGenerate(userId);
    } else {
      await assertCanCreateGapReport(userId);
    }
    return null;
  } catch (error) {
    if (isQuotaError(error)) {
      logger.warn("plan_guard_denied", {
        user_id: userId,
        route: pathname,
        quota_state: action,
        denial_reason: error.code,
        timestamp,
        request_id: requestId,
      });
      return {
        response: errorResponse("forbidden", error.message, 403, {
          requestId,
          headers: { "x-request-id": requestId },
          details: {
            quota_code: error.code,
            upgrade_required: error.upgrade_required,
          },
        }),
      };
    }
    logger.warn("plan_guard_denied", {
      user_id: userId,
      route: pathname,
      quota_state: action,
      denial_reason: "QUOTA_EXCEEDED",
      timestamp,
      request_id: requestId,
    });
    return {
      response: errorResponse("forbidden", "Plan limit reached.", 403, {
        requestId,
        headers: { "x-request-id": requestId },
        details: {
          quota_code: "QUOTA_EXCEEDED",
          upgrade_required: true,
        },
      }),
    };
  }
}
