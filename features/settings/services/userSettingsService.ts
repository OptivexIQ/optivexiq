import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";
import { hasActiveSubscription } from "@/features/billing/services/planValidationService";

export type UserSettingsRecord = {
  user_id: string;
  workspace_name: string | null;
  primary_contact: string | null;
  region: string | null;
  report_retention_days: number;
  export_restricted: boolean;
  weekly_exec_summary: boolean;
  completion_alerts: boolean;
  overlap_warnings: boolean;
  security_review_completed: boolean;
  security_review_date: string | null;
  created_at: string;
  updated_at: string;
};

export type UserSettingsUpdate = Partial<{
  workspace_name: string | null;
  primary_contact: string | null;
  region: string | null;
  report_retention_days: number;
  export_restricted: boolean;
  weekly_exec_summary: boolean;
  completion_alerts: boolean;
  overlap_warnings: boolean;
  security_review_completed: boolean;
  security_review_date: string | null;
}>;

export type UserSettingsResult =
  | { ok: true; settings: UserSettingsRecord }
  | { ok: false; error: string };

function nowIso() {
  return new Date().toISOString();
}

function buildDefaultSettings(userId: string): UserSettingsRecord {
  const now = nowIso();
  return {
    user_id: userId,
    workspace_name: null,
    primary_contact: null,
    region: null,
    report_retention_days: 180,
    export_restricted: false,
    weekly_exec_summary: false,
    completion_alerts: false,
    overlap_warnings: false,
    security_review_completed: false,
    security_review_date: null,
    created_at: now,
    updated_at: now,
  };
}

async function subscriptionExists(userId: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Subscription lookup failed.", error, { user_id: userId });
    return false;
  }

  return Boolean(data);
}

const NOTIFICATION_SETTING_KEYS = [
  "weekly_exec_summary",
  "completion_alerts",
  "overlap_warnings",
] as const;

function isNotificationUpdate(payload: UserSettingsUpdate): boolean {
  return NOTIFICATION_SETTING_KEYS.some((key) => key in payload);
}

async function assertUserScopeOrSystem(
  userId: string,
  source: "read" | "write",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    logger.error("Settings scope validation failed.", error, {
      user_id: userId,
      source,
    });
    return { ok: false, error: "Authorization failed." };
  }

  const sessionUserId = data.user?.id;
  if (!sessionUserId) {
    // No user session indicates a trusted server context (cron/worker).
    return { ok: true };
  }

  if (sessionUserId !== userId) {
    logger.warn("Settings scope mismatch denied.", {
      user_id: userId,
      session_user_id: sessionUserId,
      source,
    });
    return { ok: false, error: "Forbidden." };
  }

  return { ok: true };
}

async function fetchUserSettings(userId: string): Promise<UserSettingsResult> {
  try {
    const scope = await assertUserScopeOrSystem(userId, "read");
    if (!scope.ok) {
      return { ok: false, error: scope.error };
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("User settings fetch failed.", error, { user_id: userId });
      return { ok: false, error: error.message ?? "Settings unavailable" };
    }

    if (data) {
      return { ok: true, settings: data as UserSettingsRecord };
    }

    if (!(await subscriptionExists(userId))) {
      return { ok: true, settings: buildDefaultSettings(userId) };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: userId })
      .select("*")
      .maybeSingle();

    if (insertError || !inserted) {
      if (insertError) {
        logger.error("User settings insert failed.", insertError, {
          user_id: userId,
        });
      }
      return {
        ok: false,
        error: insertError?.message ?? "Settings unavailable",
      };
    }

    return { ok: true, settings: inserted as UserSettingsRecord };
  } catch (error) {
    logger.error("User settings fetch crashed.", error, { user_id: userId });
    return { ok: false, error: "Unexpected error" };
  }
}

async function updateUserSettingsRecord(
  userId: string,
  payload: UserSettingsUpdate,
): Promise<UserSettingsResult> {
  try {
    const scope = await assertUserScopeOrSystem(userId, "write");
    if (!scope.ok) {
      return { ok: false, error: scope.error };
    }

    // Validate active subscription only for notification setting changes
    if (isNotificationUpdate(payload)) {
      const hasSubscription = await hasActiveSubscription(userId);
      if (!hasSubscription) {
        logger.warn("Notification update blocked - no active subscription.", {
          user_id: userId,
          attempted_keys: Object.keys(payload),
        });
        return {
          ok: false,
          error: "Active subscription required to enable notifications.",
        };
      }
    }

    // For non-notification updates, only check if subscription exists (not active)
    // This allows workspace name, retention, etc. to be updated
    if (!(await subscriptionExists(userId))) {
      return { ok: false, error: "Subscription missing." };
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: userId, ...payload, updated_at: nowIso() },
        { onConflict: "user_id" },
      )
      .select("*")
      .maybeSingle();

    if (error || !data) {
      if (error) {
        logger.error("User settings upsert failed.", error, {
          user_id: userId,
        });
      }
      return { ok: false, error: error?.message ?? "Settings unavailable" };
    }

    return { ok: true, settings: data as UserSettingsRecord };
  } catch (error) {
    logger.error("User settings update crashed.", error, { user_id: userId });
    return { ok: false, error: "Unexpected error" };
  }
}

export async function getUserSettings(
  userId: string,
): Promise<UserSettingsResult> {
  return fetchUserSettings(userId);
}

export async function updateUserSettings(
  userId: string,
  payload: UserSettingsUpdate,
): Promise<UserSettingsResult> {
  return updateUserSettingsRecord(userId, payload);
}
