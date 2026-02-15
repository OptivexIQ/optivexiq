import { createSupabaseServerClient } from "@/services/supabase/server";

export type AuthCallbackResult = { ok: true } | { ok: false; error: string };

export async function exchangeAuthCodeForSession(
  code: string | null,
): Promise<AuthCallbackResult> {
  if (!code) {
    return { ok: false, error: "Missing auth code." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return { ok: false, error: error.message || "Session exchange failed." };
  }

  return { ok: true };
}
