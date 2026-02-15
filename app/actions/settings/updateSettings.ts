"use server";

import {
  userSettingsSchema,
  type UserSettingsPayload,
} from "@/features/settings/validators/userSettingsSchema";
import { updateUserSettings } from "@/features/settings/services/userSettingsService";
import type { UserSettingsRecord } from "@/features/settings/services/userSettingsService";
import { requireUser } from "@/lib/auth/server";

type UpdateSettingsResult =
  | { error: string; settings: null }
  | { error: null; settings: UserSettingsRecord };

export async function updateSettingsAction(
  payload: UserSettingsPayload,
): Promise<UpdateSettingsResult> {
  const parsed = userSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Invalid payload.", settings: null };
  }

  const user = await requireUser();
  const result = await updateUserSettings(user.id, parsed.data);

  if (!result.ok) {
    return { error: result.error, settings: null };
  }

  return { error: null, settings: result.settings };
}
