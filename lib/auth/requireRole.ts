import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/auth/getUserRole";
import { getServerUser } from "@/lib/auth/server";
import { getUserRole } from "@/lib/auth/getUserRole";

export async function requireRole(allowed: UserRole[]) {
  const user = await getServerUser();
  const role = getUserRole(user);

  if (!user || !role || !allowed.includes(role)) {
    redirect("/login");
  }

  return { user, role };
}
