import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import type { BillingPlan } from "@/features/billing/types/billing.types";

export type QuotaWindow = "lifetime" | "billing_period";
export type BillingType = "one_time" | "monthly";

export type PlanLimitsRecord = {
  plan: BillingPlan;
  billing: BillingType;
  rewrite_limit: number | null;
  rewrite_window: QuotaWindow;
  competitor_gap_limit: number | null;
  competitor_gap_window: QuotaWindow;
  token_limit: number | null;
  token_window: QuotaWindow;
  team_member_limit: number;
  created_at: string;
};

export async function getPlanLimits(
  plan: BillingPlan,
): Promise<PlanLimitsRecord | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      logger.error("Plan limits fetch unauthorized.", authError, { plan });
      return null;
    }

    const { data, error } = await supabase
      .from("plan_limits")
      .select(
        "plan, billing, rewrite_limit, rewrite_window, competitor_gap_limit, competitor_gap_window, token_limit, token_window, team_member_limit, created_at",
      )
      .eq("plan", plan)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch plan limits.", error, { plan });
      return null;
    }

    return (data as PlanLimitsRecord | null) ?? null;
  } catch (error) {
    logger.error("Plan limits fetch crashed.", error, { plan });
    return null;
  }
}


