import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth/getUserRole";
import { getUserRole } from "@/lib/auth/getUserRole";
import { requireApiUser } from "@/lib/auth/requireApiUser";

export async function requireApiRole(allowed: UserRole[]) {
  const { user, response } = await requireApiUser();

  if (response) {
    return { user: null, role: null, response };
  }

  const role = getUserRole(user);

  if (!role || !allowed.includes(role)) {
    return {
      user: null,
      role: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, role, response: null };
}
