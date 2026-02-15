"use server";

import { redirect } from "next/navigation";
import { signUpSchema } from "@/features/auth/schemas/signUpSchema";
import type { AuthActionState } from "@/features/auth/types";
import { logSignInEvent } from "@/lib/auth/audit";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/env";
import { signUpWithEmail } from "@/features/auth/services/auth.server";

function getSignUpValues(formData: FormData) {
  return {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || "") || undefined,
  };
}

function getSafeSignUpError() {
  return "Unable to create account. Please try again.";
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = getSignUpValues(formData);
  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Password does not meet the requirements." };
  }

  const siteUrl = NEXT_PUBLIC_SITE_URL ?? "";
  const emailRedirectTo = siteUrl ? `${siteUrl}/auth/callback` : undefined;
  const result = await signUpWithEmail({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.name,
    emailRedirectTo,
  });

  if (result.error) {
    return { error: getSafeSignUpError() };
  }

  if (result.data.session && result.data.user) {
    logSignInEvent(result.data.user.id, result.data.user.email);
    redirect("/dashboard");
  }

  redirect("/check-email");
}
