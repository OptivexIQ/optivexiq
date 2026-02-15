import type { User } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "founder" | "support";

export function getUserRole(user: User | null): UserRole | null {
  if (!user) {
    return null;
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role;

  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "founder" ||
    role === "support"
  ) {
    return role;
  }

  return null;
}
