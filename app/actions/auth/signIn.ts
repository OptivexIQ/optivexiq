"use server";

import { redirect } from "next/navigation";
import { loginSchema } from "@/features/auth/schemas/loginSchema";
import { createSupabaseServerClient } from "@/services/supabase/server";
import type { AuthActionState } from "@/features/auth/types";
import { logSignInEvent } from "@/lib/auth/audit";

function getLoginValues(formData: FormData) {
  return {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = getLoginValues(formData);
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (result.error) {
    return { error: result.error.message };
  }

  if (result.data.user) {
    logSignInEvent(result.data.user.id, result.data.user.email);
  }

  redirect("/dashboard");
}
