import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/requireApiUser";
import { getUserRole } from "@/lib/auth/getUserRole";

type MeResponse = {
  id: string;
  email: string | null;
  role: ReturnType<typeof getUserRole>;
};

export async function GET() {
  const { user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const body: MeResponse = {
    id: user.id,
    email: user.email ?? null,
    role: getUserRole(user),
  };

  return NextResponse.json(body);
}
