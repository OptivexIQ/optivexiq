import { getServerUser } from "@/lib/auth/getServerUser";
import type { SessionState } from "@/features/auth/services/sessionClient";

async function fetchServerSession(): Promise<SessionState> {
  const user = await getServerUser();

  if (!user) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  };
}

export async function getServerSession(): Promise<SessionState> {
  return fetchServerSession();
}
