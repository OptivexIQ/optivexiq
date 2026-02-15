import { errorResponse } from "@/lib/api/errorResponse";
import { getOnboardingState } from "@/features/saas-profile/services/profileService";
import { requiresOnboardingForPath } from "@/middleware/guardPolicy";

export type OnboardingGuardResult = null | { response: Response };

export function requiresOnboarding(pathname: string): boolean {
  return requiresOnboardingForPath(pathname);
}

export async function onboardingGuard(
  pathname: string,
  userId: string,
  requestId: string,
): Promise<OnboardingGuardResult> {
  if (!requiresOnboarding(pathname)) {
    return null;
  }

  const onboardingState = await getOnboardingState(userId);
  if (onboardingState?.onboardingCompleted) {
    return null;
  }

  return {
    response: errorResponse(
      "forbidden",
      "Complete onboarding to unlock full conversion reports.",
      403,
      {
        requestId,
        headers: { "x-request-id": requestId },
      },
    ),
  };
}
