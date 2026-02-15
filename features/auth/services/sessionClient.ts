import { resolveData } from "@/lib/data/dataSource";
import { httpClient, isHttpError, type HttpError } from "@/lib/api/httpClient";
import type { UserRole } from "@/lib/auth/getUserRole";

export type SessionUser = {
  id: string;
  email?: string | null;
  role?: UserRole | null;
};

export type SessionState = {
  authenticated: boolean;
  user: SessionUser | null;
};

const mockSession: SessionState = {
  authenticated: false,
  user: null,
};

async function fetchSession(): Promise<SessionState> {
  try {
    return await httpClient<SessionState>("/api/session", {
      method: "GET",
      credentials: "include",
    });
  } catch (error) {
    if (isHttpError(error)) {
      if (error.status === 401) {
        return { authenticated: false, user: null };
      }

      if (error.status >= 500) {
        throw error;
      }
    }

    throw (
      (error as HttpError) ?? {
        status: 500,
        message: "Session request failed",
      }
    );
  }
}

export async function getSession(): Promise<SessionState> {
  return resolveData("session", fetchSession, () => mockSession);
}
