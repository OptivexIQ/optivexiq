"use client";

import { useEffect, useState } from "react";
import {
  getSession,
  type SessionState,
} from "@/features/auth/services/sessionClient";

type SessionStatus = "loading" | "authenticated" | "unauthenticated" | "error";

type UseSessionResult = {
  data: SessionState | null;
  error: string | null;
  isLoading: boolean;
  status: SessionStatus;
};

const initialState: UseSessionResult = {
  data: null,
  error: null,
  isLoading: true,
  status: "loading",
};

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "Unknown error");
  }

  return error instanceof Error ? error.message : "Unknown error";
}

export function useSession(): UseSessionResult {
  const [state, setState] = useState<UseSessionResult>(initialState);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const data = await getSession();
        const status = data.authenticated ? "authenticated" : "unauthenticated";

        if (isMounted) {
          setState({
            data,
            error: null,
            isLoading: false,
            status,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            error: getErrorMessage(error),
            isLoading: false,
            status: "error",
          });
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
