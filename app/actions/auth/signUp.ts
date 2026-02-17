"use server";

import { redirect } from "next/navigation";
import { signUpSchema } from "@/features/auth/schemas/signUpSchema";
import type { AuthActionState } from "@/features/auth/types";
import { logSignInEvent } from "@/lib/auth/audit";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/env";
import { logger } from "@/lib/logger";
import { signUpWithEmail } from "@/features/auth/services/auth.server";

function sanitizeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/dashboard";
  }
  if (value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

function getSignUpValues(formData: FormData) {
  return {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    name: String(formData.get("name") || "") || undefined,
  };
}

function getSafeSignUpError(rawMessage?: string) {
  const normalized = (rawMessage ?? "").toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists")
  ) {
    return "An account with this email already exists. Please sign in.";
  }

  if (normalized.includes("invalid email")) {
    return "Please enter a valid email address.";
  }

  if (normalized.includes("password")) {
    return "Password does not meet the requirements.";
  }

  if (
    normalized.includes("redirect") ||
    normalized.includes("site url") ||
    normalized.includes("email redirect")
  ) {
    return "Account setup is temporarily unavailable. Please contact support.";
  }

  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "Account signup is currently unavailable.";
  }

  return "Unable to create account. Please try again.";
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const redirectTo = sanitizeRedirectPath(formData.get("redirect"));
  const values = getSignUpValues(formData);
  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Password does not meet the requirements." };
  }

  const siteUrl = NEXT_PUBLIC_SITE_URL ?? "";
  const emailRedirectTo = siteUrl
    ? `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
    : undefined;
  const result = await signUpWithEmail({
    email: parsed.data.email,
    password: parsed.data.password,
    name: parsed.data.name,
    emailRedirectTo,
  });

  if (result.error) {
    logger.warn("Sign-up failed.", {
      status: result.error.status,
      code: result.error.code,
      message: result.error.message,
    });
    return { error: getSafeSignUpError(result.error.message) };
  }

  if (result.data.session && result.data.user) {
    logSignInEvent(result.data.user.id, result.data.user.email);
    redirect(redirectTo);
  }

  redirect("/check-email");
}
