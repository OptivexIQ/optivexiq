import { createSupabaseServerReadOnlyClient } from "@/services/supabase/server";
import { logger } from "@/lib/logger";

export type UserProfile = {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  try {
    const supabase = await createSupabaseServerReadOnlyClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("full_name, avatar_url, role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Failed to fetch user profile.", error, { user_id: userId });
      return null;
    }

    return (data as UserProfile | null) ?? null;
  } catch (error) {
    logger.error("User profile fetch crashed.", error, { user_id: userId });
    return null;
  }
}
