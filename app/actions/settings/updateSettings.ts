"use server";

import {
  userSettingsSchema,
  type UserSettingsPayload,
} from "@/features/settings/validators/userSettingsSchema";
import { updateUserSettings } from "@/features/settings/services/userSettingsService";
import type { UserSettingsRecord } from "@/features/settings/services/userSettingsService";
import { requireUser } from "@/lib/auth/server";
import { MARKET_REGIONS } from "@/lib/constants/marketRegions";

type UpdateSettingsResult =
  | { error: string; settings: null }
  | { error: null; settings: UserSettingsRecord };

function normalizePayload(payload: UserSettingsPayload): UserSettingsPayload {
  const region =
    typeof payload.region === "string"
      ? (payload.region.trim() || null)
      : payload.region;

  return {
    ...payload,
    region,
  };
}

export async function updateSettingsAction(
  payload: UserSettingsPayload,
): Promise<UpdateSettingsResult> {
  const normalizedPayload = normalizePayload(payload);
  const parsed = userSettingsSchema.safeParse(normalizedPayload);
  if (!parsed.success) {
    return { error: "Invalid payload.", settings: null };
  }

  const region = parsed.data.region;
  if (region && !MARKET_REGIONS.includes(region as (typeof MARKET_REGIONS)[number])) {
    return { error: "Invalid market region.", settings: null };
  }

  const user = await requireUser();
  const result = await updateUserSettings(user.id, parsed.data);

  if (!result.ok) {
    return { error: result.error, settings: null };
  }

  return { error: null, settings: result.settings };
}