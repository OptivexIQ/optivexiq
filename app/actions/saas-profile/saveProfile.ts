"use server";

import {
  profileSchema,
  profileUpdateSchema,
} from "@/features/saas-profile/validators/profileSchema";
import type { SaasProfileFormValues } from "@/features/saas-profile/types/profile.types";
import { upsertProfile } from "@/features/saas-profile/services/profileService";
import { createSnapshotAndProcess } from "@/features/reports/services/reportCreateService";
import { createSupabaseServerClient } from "@/services/supabase/server";

type SaveProfileOptions = {
  mode?: "onboarding" | "edit";
};

export async function saveProfileAction(
  values: SaasProfileFormValues,
  options?: SaveProfileOptions,
) {
  const mode = options?.mode ?? "edit";
  const schema = mode === "onboarding" ? profileSchema : profileUpdateSchema;
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { error: "Please complete all required fields." };
  }

  const normalizedValues = parsed.data as SaasProfileFormValues;
  const payload =
    mode === "onboarding"
      ? {
          ...normalizedValues,
          onboardingProgress: 6,
          onboardingCompleted: false,
        }
      : normalizedValues;

  const result = await upsertProfile(payload, {
    markOnboardingComplete: false,
  });

  if (result.error) {
    return { error: result.error };
  }

  let snapshotReportId: string | null = null;
  if (mode === "onboarding") {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    const snapshot = await createSnapshotAndProcess(
      userId,
      payload.websiteUrl,
      "onboarding-snapshot",
    );

    if (!snapshot.ok) {
      return { error: snapshot.error };
    }

    snapshotReportId = snapshot.reportId;
  }

  return {
    error: null,
    updatedAt: result.updatedAt ?? null,
    onboardingCompletedAt: result.onboardingCompletedAt ?? null,
    snapshotReportId,
  };
}
