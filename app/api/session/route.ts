import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { getUserRole } from "@/lib/auth/getUserRole";
import type { SessionState } from "@/features/auth/services/sessionClient";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const body: SessionState = {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email ?? null,
      role: getUserRole(user),
    },
  };

  return NextResponse.json(body);
}
