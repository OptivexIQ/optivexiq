import { createSupabaseServerClient } from "@/services/supabase/server";
import { createSupabaseAdminClient } from "@/services/supabase/admin";
import {
  defaultSaasProfileValues,
  type DifferentiationRow,
  type SaasProfileFormValues,
  type TextItem,
} from "@/features/saas-profile/types/profile.types";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .filter((item) => item.trim().length > 0);
}

function toTextItems(values: string[]): TextItem[] {
  if (values.length === 0) {
    return [{ value: "" }];
  }

  return values.map((value) => ({ value }));
}

function fromTextItems(values: TextItem[]): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => item.value)
    .filter((value) => value.trim().length > 0);
}

function normalizeMatrix(value: unknown): DifferentiationRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      return {
        competitor: String(record.competitor ?? ""),
        ourAdvantage: String(record.ourAdvantage ?? ""),
        theirAdvantage: String(record.theirAdvantage ?? ""),
      };
    })
    .filter((item): item is DifferentiationRow => Boolean(item))
    .filter(
      (item) =>
        item.competitor.length > 0 ||
        item.ourAdvantage.length > 0 ||
        item.theirAdvantage.length > 0,
    );
}

function withDefaults(
  values: Partial<SaasProfileFormValues> | null,
): SaasProfileFormValues {
  const merged = { ...defaultSaasProfileValues, ...(values ?? {}) };

  if (merged.keyObjections.length === 0) {
    merged.keyObjections = [{ value: "" }];
  }

  if (merged.proofPoints.length === 0) {
    merged.proofPoints = [{ value: "" }];
  }

  if (merged.differentiationMatrix.length === 0) {
    merged.differentiationMatrix = [
      {
        competitor: "",
        ourAdvantage: "",
        theirAdvantage: "",
      },
    ];
  }

  return merged;
}

export type ProfileResult =
  | { ok: true; data: SaasProfileFormValues }
  | { ok: false; error: string };

export async function getProfile(): Promise<ProfileResult> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("saas_profiles")
    .select(
      "icp_role, primary_pain, buying_trigger, website_url, acv_range, revenue_stage, sales_motion, conversion_goal, pricing_model, key_objections, proof_points, differentiation_matrix, onboarding_progress, onboarding_completed, updated_at, onboarding_completed_at",
    )
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Unable to load profile" };
  }

  if (!data) {
    return { ok: true, data: withDefaults(null) };
  }

  const mapped: Partial<SaasProfileFormValues> = {
    icpRole: data.icp_role ?? "",
    primaryPain: data.primary_pain ?? "",
    buyingTrigger: data.buying_trigger ?? "",
    websiteUrl: data.website_url ?? "",
    acvRange: data.acv_range ?? "",
    revenueStage: data.revenue_stage ?? defaultSaasProfileValues.revenueStage,
    salesMotion: data.sales_motion ?? "",
    conversionGoal:
      data.conversion_goal ?? defaultSaasProfileValues.conversionGoal,
    pricingModel: data.pricing_model ?? "",
    keyObjections: toTextItems(normalizeStringArray(data.key_objections)),
    proofPoints: toTextItems(normalizeStringArray(data.proof_points)),
    differentiationMatrix: normalizeMatrix(data.differentiation_matrix),
    onboardingProgress:
      data.onboarding_progress ?? defaultSaasProfileValues.onboardingProgress,
    onboardingCompleted:
      data.onboarding_completed ?? defaultSaasProfileValues.onboardingCompleted,
    updatedAt: data.updated_at ?? null,
    onboardingCompletedAt: data.onboarding_completed_at ?? null,
  };

  return { ok: true, data: withDefaults(mapped) };
}

type UpsertProfileOptions = {
  markOnboardingComplete?: boolean;
};

export async function upsertProfile(
  values: SaasProfileFormValues,
  options?: UpsertProfileOptions,
) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { error: "Unauthorized" };
  }

  const markComplete = options?.markOnboardingComplete ?? true;
  const completedAt = markComplete
    ? (values.onboardingCompletedAt ?? new Date().toISOString())
    : (values.onboardingCompletedAt ?? null);
  const payload = {
    user_id: authData.user.id,
    icp_role: values.icpRole,
    primary_pain: values.primaryPain,
    buying_trigger: values.buyingTrigger,
    website_url: values.websiteUrl,
    acv_range: values.acvRange,
    revenue_stage: values.revenueStage,
    sales_motion: values.salesMotion,
    conversion_goal: values.conversionGoal,
    pricing_model: values.pricingModel,
    key_objections: fromTextItems(values.keyObjections),
    proof_points: fromTextItems(values.proofPoints),
    differentiation_matrix: values.differentiationMatrix,
    onboarding_progress: values.onboardingProgress,
    onboarding_completed: values.onboardingCompleted,
    updated_at: new Date().toISOString(),
    onboarding_completed_at: completedAt,
  };

  if (values.updatedAt) {
    const { data: updatedRows, error: updateError } = await supabase
      .from("saas_profiles")
      .update(payload)
      .eq("user_id", authData.user.id)
      .eq("updated_at", values.updatedAt)
      .select("user_id")
      .maybeSingle();

    if (updateError) {
      return { error: "Unable to save profile." };
    }

    if (!updatedRows) {
      return { error: "Profile was updated elsewhere. Refresh and try again." };
    }

    return {
      error: null,
      updatedAt: payload.updated_at,
      onboardingCompletedAt: payload.onboarding_completed_at,
    };
  }

  const { error: insertError } = await supabase
    .from("saas_profiles")
    .insert(payload);

  if (insertError) {
    return { error: "Unable to save profile." };
  }

  return {
    error: null,
    updatedAt: payload.updated_at,
    onboardingCompletedAt: payload.onboarding_completed_at,
  };
}

type OnboardingState = {
  onboardingProgress: number;
  onboardingCompleted: boolean;
};

export async function getOnboardingState(
  userId: string,
): Promise<OnboardingState | null> {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user || authData.user.id !== userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("saas_profiles")
    .select("onboarding_progress, onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    onboardingProgress: data.onboarding_progress ?? 0,
    onboardingCompleted: data.onboarding_completed ?? false,
  };
}

export async function markOnboardingComplete(userId: string) {
  // Security invariant:
  // This path is intentionally service-role because snapshot completion can run
  // in trusted background processing contexts without an end-user session.
  const admin = createSupabaseAdminClient("worker");
  const { error } = await admin
    .from("saas_profiles")
    .update({
      onboarding_progress: 7,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: "Unable to update onboarding status." };
  }

  return { ok: true };
}

